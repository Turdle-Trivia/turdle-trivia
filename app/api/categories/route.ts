// app/api/categories/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET() {
	try {
		const client = await clientPromise;
		const db = client.db();

		const categories = await db.collection("categories").find({}).sort({ category_name: 1 }).toArray();

		return NextResponse.json(categories, { status: 200 });
	} catch (err) {
		console.error("Failed to fetch categories:", err);
		return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
	}
}
