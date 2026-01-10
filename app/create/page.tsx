"use client";

import { useEffect, useState, useId } from "react";
import Select from "react-select";
import { Button } from "../../components/Button";
import {
  CreateQuestionForm,
  Question,
} from "../../components/CreateQuestionForm";
import { useRouter } from "next/navigation";

export default function Create() {
  const [totalQuestions, setTotalQuestions] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [questionType, setQuestionType] = useState<"random" | "custom">(
    "random"
  );
  const [goal, setGoal] = useState("");
  const [prize, setPrize] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const instanceId = useId();

  const router = useRouter();

  useEffect(() => {
    async function getCategories() {
      const response = await fetch("/api/categories");
      const data = await response.json();
      const formattedData = data.map((category: any) => ({
        value: category.category_id,
        label: category.category_name,
      }));
      setCategoryOptions(formattedData);
      console.log(formattedData);
    }
    getCategories();
  }, []);

  const handleQuestionChange = (index: number, q: Question) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = q;
      return newQuestions;
    });
  };

  const handleSubmit = async () => {
    if (goal.length > 100) {
      alert("Goal must be 100 characters or less");
      return;
    }
    if (prize.length > 100) {
      alert("Prize must be 100 characters or less");
      return;
    }

    const numQuestions = Number(totalQuestions);
    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 25) {
      alert("Total questions must be between 1 and 25");
      return;
    }

    const minCorrect = Number(passingScore);
    if (isNaN(minCorrect) || minCorrect > numQuestions || minCorrect <= 0) {
      alert("Passing score must be less than or equal to total questions");
      return;
    }

    if (questionType === "custom") {
      for (let i = 0; i < numQuestions; i++) {
        const q = questions[i];
        if (!q) {
          alert(`Please complete question ${i + 1}`);
          return;
        }
        if (q.question.length > 300) {
          alert(`Question ${i + 1} must be 300 characters or less`);
          return;
        }
        for (const a of q.answer_choices) {
          if (a.answer_value.length > 150) {
            alert(
              `Answer choices for question ${
                i + 1
              } must be 150 characters or less`
            );
            return;
          }
        }
      }
    }

    if (questionType === "random" && selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }

    const payload = {
      code_value: prize,
      code_name: goal,
      num_questions: Number(totalQuestions),
      min_correct: Number(passingScore),
      is_custom_quiz: questionType === "custom",
      questions:
        questionType === "custom"
          ? questions.slice(0, Number(totalQuestions))
          : undefined,
      categories: questionType === "random" ? selectedCategories : undefined,
    };

    const res = await fetch("/api/quizzes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data?.quiz_id) {
      router.push(`/quiz/links/${data.quiz_id}`);
    } else {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="bg-[#fff3da] min-h-dvh flex w-full items-center justify-center p-4">
      <main className="flex flex-col gap-8 w-full max-w-lg">
        <div className="flex flex-col gap-2">
          <label htmlFor="goal" className="text-3xl font-bold text-[#402100]">
            Goal
          </label>
          <p className="text-[#402100]/80 font-medium">
            This is what you want the quiz-taker to obtain by passing the quiz
            (Sam's bank vault code, Michael's phone number, etc.)
          </p>
          <input
            id="goal"
            type="text"
            maxLength={100}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-[#8B4513] bg-white/50 text-[#402100] text-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="prize" className="text-3xl font-bold text-[#402100]">
            Prize
          </label>
          <p className="text-[#402100]/80 font-medium">
            This is actual value the quiz-taker gets by passing the quiz (the
            actual phone number, a pin code for a lock, etc.)
          </p>
          <input
            id="prize"
            type="text"
            maxLength={100}
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            className="w-full p-4 rounded-2xl border-2 border-[#8B4513] bg-white/50 text-[#402100] text-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="totalQuestions"
            className="text-3xl font-bold text-[#402100]"
          >
            Total Questions
          </label>
          <p className="text-[#402100]/80 font-medium">
            How many questions will be in this quiz? (Max 25)
          </p>
          <input
            id="totalQuestions"
            type="number"
            min="1"
            max={25}
            value={totalQuestions}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setTotalQuestions("");
                return;
              }
              if (Number(val) <= 25 && Number(val) >= 0) {
                setTotalQuestions(val);
                if (passingScore && Number(passingScore) > Number(val)) {
                  setPassingScore(val);
                }
              }
            }}
            onBlur={() => {
              if (totalQuestions !== "" && Number(totalQuestions) < 1) {
                setTotalQuestions("1");
              }
            }}
            className="w-full p-4 rounded-2xl border-2 border-[#8B4513] bg-white/50 text-[#402100] text-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="passingScore"
            className="text-3xl font-bold text-[#402100]"
          >
            Passing Score
          </label>
          <p className="text-[#402100]/80 font-medium">
            How many correct answers are required to pass?
          </p>
          <input
            id="passingScore"
            type="number"
            min="1"
            max={totalQuestions}
            value={passingScore}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setPassingScore("");
                return;
              }
              if (Number(val) <= Number(totalQuestions) && Number(val) >= 0) {
                setPassingScore(val);
              }
            }}
            className="w-full p-4 rounded-2xl border-2 border-[#8B4513] bg-white/50 text-[#402100] text-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] transition-all"
          />
        </div>

        <div className="cursor-pointer flex bg-white/50 p-1 rounded-2xl">
          <button
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
              questionType === "random"
                ? "bg-[#8B4513] text-white shadow-md"
                : "text-[#8B4513] hover:bg-white/50"
            }`}
            onClick={() => setQuestionType("random")}
          >
            Random Questions
          </button>
          <button
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
              questionType === "custom"
                ? "bg-[#8B4513] text-white shadow-md"
                : "text-[#8B4513] hover:bg-white/50"
            }`}
            onClick={() => setQuestionType("custom")}
          >
            Custom Questions
          </button>
        </div>

        {questionType === "random" ? (
          <div className="flex flex-col gap-2">
            <label className="text-3xl font-bold text-[#402100]">
              Category
            </label>
            <Select
              instanceId={instanceId}
              options={categoryOptions}
              isMulti
              closeMenuOnSelect={false}
              blurInputOnSelect={false}
              onChange={(newValue: any) =>
                setSelectedCategories(
                  newValue.map((item: any) => Number(item.value))
                )
              }
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "1rem",
                  padding: "0.5rem",
                  borderColor: "#8B4513",
                  borderWidth: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  boxShadow: "none",
                  "&:hover": {
                    borderColor: "#8B4513",
                  },
                }),
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {(Number(totalQuestions) == 0 || Number(passingScore) == 0) && (
              <p className="text-center">
                You must enter the 'Total Questions' and 'Passing Score' first.
              </p>
            )}
            {Array.from({
              length: Number(totalQuestions) || 0,
            }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-[#402100]">
                  Question {index + 1}
                </h3>
                <CreateQuestionForm
                  onChange={(q) => handleQuestionChange(index, q)}
                />
              </div>
            ))}
          </div>
        )}

        <Button
          backgroundColor="#00b300"
          textColor="#fff"
          className="w-full"
          onClick={handleSubmit}
        >
          Submit Quiz
        </Button>

        <p className="text-center text-[#8B4513] font-bold bg-white/30 p-4 rounded-xl">
          Note: The goal and prize should NOT be secret, as all quizzes on the
          site are public.
        </p>
      </main>
    </div>
  );
}
