import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function POST(
	req: Request,
	{ params }: { params: { quiz_id: string } }
) {
	try {
		const quiz_id = parseInt(params.quiz_id, 10);

		// Validate quiz_id
		if (isNaN(quiz_id)) {
			return NextResponse.json({ error: "Invalid quiz_id" }, { status: 400 });
		}

		// Parse request body
		const body = await req.json();
		const { answers } = body;

		// Validate answers array
		if (!Array.isArray(answers)) {
			return NextResponse.json(
				{ error: "answers must be an array" },
				{ status: 400 }
			);
		}

		// Validate each answer object
		for (const answer of answers) {
			if (
				typeof answer.question_id !== "number" ||
				typeof answer.answer_id !== "string"
			) {
				return NextResponse.json(
					{ error: "Each answer must have question_id (number) and answer_id (string)" },
					{ status: 400 }
				);
			}
		}

		// Fetch quiz from database
		const client = await clientPromise;
		const db = client.db();
		const quiz = await db.collection("quizzes").findOne({ quiz_id });

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
				.find({ quiz_id })
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

		// Build response
		const response: any = {
			quiz_id: quiz.quiz_id,
			code_name: quiz.code_name,
			num_questions: num_questions,
			min_correct: min_correct,
			num_correct: num_correct,
			percent_correct: percent_correct,
			is_passing_score: is_passing_score,
		};

		// Include code_value only if passing
		if (is_passing_score && quiz.code_value) {
			response.code_value = quiz.code_value;
		}

		return NextResponse.json(response, { status: 200 });
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "Failed to grade quiz" },
			{ status: 500 }
		);
	}
}
