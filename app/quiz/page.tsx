"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

export default function Page() {
  const [quizId, setQuizId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleStart = async () => {
    if (!quizId) {
      setError("Please enter a quiz ID");
      return;
    }

    try {
      const res = await fetch(`/api/quizzes/${quizId}/info`);
      if (res.ok) {
        router.push(`/quiz/take/${quizId}`);
      } else {
        setError("Invalid Quiz ID");
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="bg-[#fff3da] min-h-dvh flex items-center justify-center p-4">
      <main className="flex flex-col items-center gap-6 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-[#402100] text-center">
          Enter Quiz ID
        </h1>

        <div className="w-full flex flex-col gap-2">
          <input
            className="w-full p-4 rounded-xl border-2 border-[#8B4513] text-lg font-medium outline-none focus:bg-white bg-white/50 transition-colors text-[#402100]"
            placeholder="Quiz ID"
            value={quizId}
            onChange={(e) => {
              setQuizId(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStart();
            }}
          />
          {error && <p className="text-red-600 font-bold ml-2">{error}</p>}
        </div>

        <Button
          onClick={handleStart}
          backgroundColor="#00b300"
          textColor="#fff"
          className="w-40"
        >
          Start
        </Button>
      </main>
    </div>
  );
}
