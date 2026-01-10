import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET() {
	try {
		const client = await clientPromise;
		const db = client.db();

		// MongoDB ping
		await db.command({ ping: 1 });

		return NextResponse.json(
			{
				status: "ok",
				mongodb: "connected",
				timestamp: new Date().toISOString(),
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Health check failed:", error);

		return NextResponse.json(
			{
				status: "error",
				mongodb: "disconnected",
			},
			{ status: 503 }
		);
	}
}
