import clientPromise from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

// GET /api/quizzes/[quiz_id]/info
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ quiz_id: string }> } // params is a Promise
) {
	try {
		// Await the params to get the actual values
		const { quiz_id } = await params;

		// Validate quiz_id
		if (!quiz_id) {
			return NextResponse.json({ error: "quiz_id is required" }, { status: 400 });
		}

		// Connect to MongoDB
		const client = await clientPromise;
		const db = client.db(); // Use your database name if different
		const quizzesCollection = db.collection("quizzes");

		// Find the quiz by quiz_id
		let quiz = await quizzesCollection.findOne({ quiz_id: quiz_id });

		// If quiz not found
		if (!quiz) {
			return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
		}

		// Extract only the required fields
		const quizInfo = {
			quiz_id: quiz.quiz_id,
			code_name: quiz.code_name || "",
			num_questions: quiz.num_questions || 0,
			min_correct: quiz.min_correct || 0,
			is_custom_quiz: quiz.is_custom_quiz || false,
			categories: quiz.categories || null,
			stats: quiz.stats || null,
		};

		return NextResponse.json(quizInfo, { status: 200 });
	} catch (error: any) {
		console.error("Error fetching quiz info:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
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
