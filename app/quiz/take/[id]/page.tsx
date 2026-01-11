"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/Button";
import ReactConfetti from "react-confetti";

interface AnswerChoice {
  answer_value: string;
  answer_id: number;
}

interface Question {
  question_id: number;
  question: string;
  answer_choices: AnswerChoice[];
}

interface QuizData {
  code_name: string;
  questions: Question[];
  min_correct: number;
  num_questions: number;
}

interface GradeResponse {
  quiz_id: number;
  code_name: string;
  num_questions: number;
  min_correct: number;
  num_correct: number;
  percent_correct: number;
  is_passing_score: boolean;
  code_value?: string;
}

export default function Page() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<GradeResponse | null>(null);

  useEffect(() => {
    async function getQuestions() {
      const response = await fetch(`/api/quizzes/${id}/questions`);
      const data = await response.json();
      setQuiz(data);
      console.log(data);
    }
    getQuestions();
  }, [id]);

  useEffect(() => {
    if (result) {
      const audio = new Audio(
        result.is_passing_score ? "/audio/fanfare.mp3" : "/audio/fart.mp3"
      );
      audio.play();
    }
  }, [result]);

  if (!quiz) {
    return (
      <div className="bg-[#fff3da] h-dvh flex items-center justify-center">
        <p className="text-[#402100] text-xl font-bold animate-pulse">
          Loading...
        </p>
      </div>
    );
  }
  console.log(result);
  if (result) {
    return (
      <div className="bg-[#fff3da] min-h-dvh flex items-center justify-center p-4">
        {result.is_passing_score && (
          <ReactConfetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={500}
            tweenDuration={10000}
          />
        )}
        <main className="flex flex-col items-center gap-6 w-full max-w-lg">
          <h1 className="text-3xl font-bold text-[#402100] text-center">
            {result.is_passing_score
              ? "Congratulations!"
              : "Better luck next time!"}
          </h1>

          <div className="bg-white/50 p-6 rounded-2xl border-2 border-[#8B4513] w-full text-center">
            <p className="text-xl text-[#402100] font-medium mb-4">
              You scored {result.num_correct} out of {result.num_questions}
            </p>
            <p className="text-lg text-[#8B4513]">
              ({Math.round(result.percent_correct)}%)
            </p>
          </div>

          {result.is_passing_score && result.code_value && (
            <div className="bg-[#00b300] p-6 rounded-2xl shadow-lg w-full text-center">
              <p className="text-white font-bold text-xl mb-2">
                Here is your code:
              </p>
              <p className="text-white font-mono text-3xl">
                {result.code_value}
              </p>
            </div>
          )}

          <Button
            onClick={() => window.location.reload()}
            backgroundColor="#8B4513"
            textColor="#fff"
            className="w-40"
          >
            Try Again
          </Button>
        </main>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestion.question_id];

  return (
    <div className="bg-[#fff3da] min-h-dvh flex items-center justify-center p-4">
      <main className="flex flex-col items-center gap-6 w-full max-w-lg">
        {!started ? (
          <>
            <h1 className="text-3xl font-bold text-[#402100] text-center">
              Solve this quiz to gain access to <br />
              <span className="text-[#8B4513]">{quiz.code_name}</span>
            </h1>
            <p className="text-[#402100] text-center text-lg">
              You must get at least{" "}
              <span className="font-bold">
                {quiz.min_correct}/{quiz.num_questions}
              </span>{" "}
              questions correct to pass the quiz.
            </p>
            <Button
              onClick={() => setStarted(true)}
              backgroundColor="#00b300"
              textColor="#fff"
              className="w-40"
            >
              Start
            </Button>
          </>
        ) : (
          <>
            <div className="w-full flex justify-between text-[#8B4513] font-bold mb-2">
              <span>Question {currentQuestionIndex + 1}</span>
              <span>
                {currentQuestionIndex + 1} / {quiz.questions.length}
              </span>
            </div>

            <div className="bg-white/50 p-6 rounded-2xl border-2 border-[#8B4513] w-full mb-4">
              <p className="text-xl text-[#402100] font-medium">
                {currentQuestion.question}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {currentQuestion.answer_choices.map((choice) => (
                <button
                  key={choice.answer_id}
                  className={`w-full p-4 rounded-xl border-2 border-[#8B4513] text-lg font-medium transition-colors text-left ${
                    selectedAnswer === choice.answer_id
                      ? "bg-[#8B4513] text-white"
                      : "bg-white text-[#402100] hover:bg-[#fff3da]"
                  }`}
                  onClick={() => {
                    setUserAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.question_id]: choice.answer_id,
                    }));
                  }}
                >
                  {choice.answer_value}
                </button>
              ))}
            </div>

            <div className="flex w-full gap-4">
              <button
                className="flex-1 py-3 rounded-xl font-bold text-lg text-[#8B4513] border-2 border-[#8B4513] hover:bg-[#fff3da] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </button>
              <button
                className="flex-1 py-3 rounded-xl font-bold text-lg text-white bg-[#00b300] shadow-lg hover:scale-105 hover:brightness-110 active:scale-95 active:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={async () => {
                  if (currentQuestionIndex < quiz.questions.length - 1) {
                    setCurrentQuestionIndex((prev) => prev + 1);
                  } else {
                    const response = await fetch(`/api/quizzes/${id}/grade`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        answers: Object.entries(userAnswers).map(
                          ([qId, aId]) => ({
                            question_id: Number(qId),
                            answer_id: Number(aId),
                          })
                        ),
                      }),
                    });
                    console.log(
                      JSON.stringify({
                        answers: Object.entries(userAnswers).map(
                          ([qId, aId]) => ({
                            question_id: Number(qId),
                            answer_id: String(aId),
                          })
                        ),
                      })
                    );
                    const data = await response.json();
                    console.log(data);
                    setResult(data);
                  }
                }}
                disabled={selectedAnswer === undefined}
              >
                {currentQuestionIndex === quiz.questions.length - 1
                  ? "Finish"
                  : "Next"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
