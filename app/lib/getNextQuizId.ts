import clientPromise from "./mongodb";

export async function getNextQuizId() {
	const client = await clientPromise;
	const db = client.db();
	const collection = db.collection("counters");

	// Try to increment the counter
	const result = await collection.findOneAndUpdate(
		{ _id: "quiz_id" },
		{ $inc: { seq: 1 } },
		{
			returnDocument: "after",
			upsert: false, // Don't upsert, we'll handle creation manually
		}
	);

	console.log(result);

	// If counter doesn't exist, create it
	if (!result) {
		// Insert with seq=1001 since we want to return 1000 for current call
		// and the next call should get 1001
		await collection.insertOne({ _id: "quiz_id", seq: 1001 });
		return 1000;
	}

	return result.seq;
}
