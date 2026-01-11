import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function POST(req: Request, { params }: { params: Promise<{ quiz_id: string }> }) {
	try {
		const { quiz_id } = await params;

		// Validate quiz_id
		console.log("Grading quiz with quiz_id:", quiz_id);
		if (!quiz_id) {
			return NextResponse.json({ error: "quiz_id is required" }, { status: 400 });
		}

		// Parse request body
		const body = await req.json();
		const { answers } = body;

		// Validate answers array
		if (!Array.isArray(answers)) {
			return NextResponse.json({ error: "answers must be an array" }, { status: 400 });
		}

		// Validate each answer object
		for (const answer of answers) {
			if (typeof answer.question_id !== "number" || typeof answer.answer_id !== "number") {
				return NextResponse.json(
					{ error: "Each answer must have question_id (number) and answer_id (number)" },
					{ status: 400 }
				);
			}
		}

		// Fetch quiz from database
		const client = await clientPromise;
		const db = client.db();
		const quiz = await db.collection("quizzes").findOne({ quiz_id: quiz_id });

		if (!quiz) {
			return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
		}

		let questionsToGrade: any[] = [];

		if (quiz.is_custom_quiz) {
			// Each custom quiz has its own questions array stored in the quiz document
			if (!quiz.questions || !Array.isArray(quiz.questions)) {
				return NextResponse.json(
					{ error: "Custom quiz does not have questions available for grading" },
					{ status: 400 }
				);
			}
			questionsToGrade = quiz.questions;
		} else {
			// Non-custom quizzes: fetch questions from the questions collection
			const questions = await db
				.collection("questions")
				.find({ question_id: { $in: answers.map((a) => a.question_id) } })
				.toArray();

			if (!questions || questions.length === 0) {
				return NextResponse.json(
					{ error: "Quiz does not have questions available for grading" },
					{ status: 400 }
				);
			}
			questionsToGrade = questions;
		}

		// Create a map of question_id to correct_id for efficient lookup
		const questionMap = new Map<number, number>();
		for (const question of questionsToGrade) {
			questionMap.set(question.question_id, question.correct_id);
		}

		// Calculate number of correct answers
		let num_correct = 0;
		for (const answer of answers) {
			const correct_id = questionMap.get(answer.question_id);
			if (correct_id !== undefined) {
				// Convert answer_id string to number for comparison
				const submittedAnswerId = parseInt(answer.answer_id, 10);
				if (!isNaN(submittedAnswerId) && submittedAnswerId === correct_id) {
					num_correct++;
				}
			}
		}

		// Calculate percent correct
		const num_questions = quiz.num_questions || questionsToGrade.length;
		const percent_correct = num_questions > 0 ? (num_correct / num_questions) * 100 : 0;

		// Determine if passing
		const min_correct = quiz.min_correct || 0;
		const is_passing_score = num_correct >= min_correct;
		const score = Math.round(percent_correct * 100) / 100; // Round to 2 decimal places

		// Update quiz stats
		const currentStats = quiz.stats || {
			num_attempts: 0,
			num_passes: 0,
			num_fails: 0,
			high_score: 0,
			low_score: 100,
			avg_score: 0,
			score_history: [],
		};

		// Calculate new stats
		const newNumAttempts = currentStats.num_attempts + 1;
		const newNumPasses = currentStats.num_passes + (is_passing_score ? 1 : 0);
		const newNumFails = currentStats.num_fails + (is_passing_score ? 0 : 1);
		const newHighScore = Math.max(currentStats.high_score, score);
		const newLowScore = currentStats.num_attempts === 0 ? score : Math.min(currentStats.low_score, score);

		// Calculate new average
		const totalScoreSum = currentStats.avg_score * currentStats.num_attempts + score;
		const newAvgScore = totalScoreSum / newNumAttempts;

		// Add to score history (optional, but useful for detailed analytics)
		const newScoreHistory = [
			...(currentStats.score_history || []),
			{
				score: score,
				timestamp: new Date(),
				passed: is_passing_score,
			},
		];

		// Update stats in database
		await db.collection("quizzes").updateOne(
			{ quiz_id: quiz_id },
			{
				$set: {
					stats: {
						num_attempts: newNumAttempts,
						num_passes: newNumPasses,
						num_fails: newNumFails,
						high_score: newHighScore,
						low_score: newLowScore,
						avg_score: Math.round(newAvgScore * 100) / 100, // Round to 2 decimals
						score_history: newScoreHistory,
					},
				},
			}
		);

		// Build response
		const response: any = {
			quiz_id: quiz.quiz_id,
			code_name: quiz.code_name,
			num_questions: num_questions,
			min_correct: min_correct,
			num_correct: num_correct,
			percent_correct: percent_correct,
			is_passing_score: is_passing_score,
			score: score,
			stats: {
				num_attempts: newNumAttempts,
				num_passes: newNumPasses,
				num_fails: newNumFails,
				high_score: newHighScore,
				low_score: newLowScore,
				avg_score: Math.round(newAvgScore * 100) / 100,
				pass_rate: newNumAttempts > 0 ? Math.round((newNumPasses / newNumAttempts) * 100 * 100) / 100 : 0,
			},
		};

		// Include code_value only if passing
		if (is_passing_score && quiz.code_value) {
			response.code_value = quiz.code_value;
		}

		return NextResponse.json(response, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json({ error: "Failed to grade quiz" }, { status: 500 });
	}
}
