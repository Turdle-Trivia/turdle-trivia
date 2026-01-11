import clientPromise from "./mongodb";

/**
 * Generate a unique quiz_id from code_name
 * Converts to lowercase, dash-separated, and appends number if needed
 */
export async function generateQuizId(code_name: string): Promise<string> {
	const client = await clientPromise;
	const db = client.db();
	const quizzesCollection = db.collection("quizzes");

	// Convert code_name to slug format
	const baseSlug = code_name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "") // Remove special characters
		.replace(/\s+/g, "-") // Replace spaces with dashes
		.replace(/-+/g, "-"); // Replace multiple dashes with single dash

	// Check if this slug already exists
	const existingQuiz = await quizzesCollection.findOne({
		quiz_id: baseSlug,
	});

	// If it doesn't exist, return the base slug
	if (!existingQuiz) {
		return baseSlug;
	}

	// If it exists, find a unique slug by appending numbers
	let counter = 1;
	let uniqueSlug = `${baseSlug}-${counter}`;

	// Keep incrementing until we find a unique slug
	while (await quizzesCollection.findOne({ quiz_id: uniqueSlug })) {
		counter++;
		uniqueSlug = `${baseSlug}-${counter}`;
	}

	return uniqueSlug;
}

/**
 * Helper to check if a quiz_id already exists
 */
export async function checkQuizIdExists(quiz_id: string): Promise<boolean> {
	const client = await clientPromise;
	const db = client.db();
	const quizzesCollection = db.collection("quizzes");

	const existingQuiz = await quizzesCollection.findOne({ quiz_id });
	return !!existingQuiz;
}
