// app/api/quizzes/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { generateQuizId } from "@/app/lib/generateQuizId";

const MAX_QUESTIONS = 25;
const MAX_CODE_LENGTH = 100;
const MAX_QUESTION_LENGTH = 300;
const MAX_ANSWER_LENGTH = 150;

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const { code_value, code_name, num_questions, min_correct, is_custom_quiz, questions, categories } = body;

		// ---------- Base validation ----------
		if (
			typeof code_value !== "string" ||
			typeof code_name !== "string" ||
			typeof num_questions !== "number" ||
			typeof min_correct !== "number" ||
			typeof is_custom_quiz !== "boolean"
		) {
			return NextResponse.json({ error: "Invalid or missing required fields" }, { status: 400 });
		}

		if (code_value.length == 0 || code_name.length == 0) {
			return NextResponse.json({ error: "code_name and code_value must not be empty" }, { status: 400 });
		}

		if (code_value.length > MAX_CODE_LENGTH || code_name.length > MAX_CODE_LENGTH) {
			return NextResponse.json(
				{ error: "code_name and code_value must be at most 100 characters" },
				{ status: 400 }
			);
		}

		if (num_questions < 1 || num_questions > MAX_QUESTIONS) {
			return NextResponse.json({ error: "num_questions must be between 1 and 25" }, { status: 400 });
		}

		if (min_correct < 0 || min_correct > num_questions) {
			return NextResponse.json(
				{ error: "min_correct must be between 0 and the number of questions" },
				{ status: 400 }
			);
		}

		// ---------- Custom quiz validation ----------
		if (is_custom_quiz) {
			if (!Array.isArray(questions) || questions.length !== num_questions) {
				return NextResponse.json(
					{ error: "Custom quiz must include the number of questions specified" },
					{ status: 400 }
				);
			}

			for (const q of questions) {
				if (
					typeof q.question !== "string" ||
					q.question.length === 0 ||
					q.question.length > MAX_QUESTION_LENGTH ||
					typeof q.correct_id !== "number" ||
					!Array.isArray(q.answer_choices) ||
					q.answer_choices.length !== 4
				) {
					return NextResponse.json({ error: "Invalid question format or length" }, { status: 400 });
				}

				const answerIds = new Set<number>();
				const answerValues = new Set<string>();

				for (const a of q.answer_choices) {
					if (
						typeof a.answer_id !== "number" ||
						typeof a.answer_value !== "string" ||
						a.answer_value.length === 0 ||
						a.answer_value.length > MAX_ANSWER_LENGTH
					) {
						return NextResponse.json({ error: "Invalid answer choice format or length" }, { status: 400 });
					}

					answerIds.add(a.answer_id);
					answerValues.add(a.answer_value);
				}

				if (answerIds.size !== 4 || !answerIds.has(q.correct_id)) {
					return NextResponse.json(
						{ error: "Answer IDs must be unique (0–3) and include correct_id" },
						{ status: 400 }
					);
				}

				if (answerValues.size !== 4) {
					return NextResponse.json({ error: "answer_value must be unique per question" }, { status: 400 });
				}
			}
		} else {
			// ---------- Non-custom quiz validation ----------
			if (!Array.isArray(categories)) {
				return NextResponse.json(
					{ error: "categories array required when is_custom_quiz is false" },
					{ status: 400 }
				);
			}
		}

		// ---------- Generate quiz_id ----------
		const quiz_id = await generateQuizId(code_name);

		// ---------- Build quiz document ----------
		const quiz: any = {
			quiz_id,
			code_value,
			code_name,
			num_questions,
			min_correct,
			is_custom_quiz,
			createdAt: new Date(),
		};

		if (is_custom_quiz) {
			quiz.questions = questions.map((q: any, index: number) => ({
				question_id: index + 1,
				question: q.question,
				correct_id: q.correct_id,
				answer_choices: q.answer_choices,
			}));
		} else {
			quiz.categories = categories;
		}

		// ---------- Insert ----------
		const client = await clientPromise;
		const db = client.db();
		await db.collection("quizzes").insertOne(quiz);

		// ---------- Response ----------
		const response: any = {
			quiz_id,
			code_name,
			num_questions,
			min_correct,
			is_custom_quiz,
		};

		if (!is_custom_quiz) {
			response.categories = categories;
		}

		return NextResponse.json(response, { status: 201 });
	} catch (err) {
		console.error(err);
		return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
	}
}
