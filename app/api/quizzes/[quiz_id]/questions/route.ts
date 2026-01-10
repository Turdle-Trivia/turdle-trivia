import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// GET /api/quizzes/[quiz_id]/questions
export async function GET(request: NextRequest, { params }: { params: Promise<{ quiz_id: string }> }) {
	try {
		// Await the params
		const { quiz_id } = await params;

		// Validate quiz_id
		if (!quiz_id) {
			return NextResponse.json({ error: "quiz_id is required" }, { status: 400 });
		}

		// Connect to MongoDB
		const client = await clientPromise;
		const db = client.db();
		const quizzesCollection = db.collection("quizzes");
		const questionsCollection = db.collection("questions");

		// Parse quiz_id
		const quizIdNum = parseInt(quiz_id);
		let quiz;

		if (!isNaN(quizIdNum)) {
			quiz = await quizzesCollection.findOne({ quiz_id: quizIdNum });
		} else {
			quiz = await quizzesCollection.findOne({ quiz_id: quiz_id });
		}

		// If quiz not found
		if (!quiz) {
			return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
		}

		let questions = [];

		if (quiz.is_custom_quiz) {
			// For custom quizzes, get questions directly linked to this quiz
			// OR questions have a `quiz_id` field
			questions = quiz.questions || [];
		} else {
			// For non-custom quizzes, randomly select questions based on categories
			if (quiz.categories && Array.isArray(quiz.categories) && quiz.categories.length > 0) {
				// Get random questions from the specified categories
				questions = await questionsCollection
					.aggregate([
						{ $match: { category_id: { $in: quiz.categories } } },
						{ $sample: { size: quiz.num_questions } },
					])
					.toArray();
			} else {
				// If no categories specified, get random questions from any category
				questions = await questionsCollection.aggregate([{ $sample: { size: quiz.num_questions } }]).toArray();
			}
		}

		// If we couldn't find enough questions
		if (questions.length < quiz.num_questions) {
			return NextResponse.json({ error: "Not enough questions available" }, { status: 404 });
		}

		// Shuffle answer choices for each question
		const questionsWithShuffledAnswers = questions.map((question) => {
			const shuffledAnswers = shuffleArray(question.answer_choices);
			return {
				question_id: question.question_id,
				question: question.question,
				answer_choices: shuffledAnswers,
			};
		});

		// Create response object
		const response = {
			quiz_id: quiz.quiz_id,
			code_name: quiz.code_name || "",
			num_questions: quiz.num_questions || 0,
			min_correct: quiz.min_correct || 0,
			is_custom_quiz: quiz.is_custom_quiz || false,
			categories: quiz.categories || null,
			questions: questionsWithShuffledAnswers,
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error: any) {
		console.error("Error fetching quiz questions:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
