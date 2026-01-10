"use client";

import React, { useState, useEffect } from "react";

export interface AnswerChoice {
  answer_value: string;
  answer_id: number;
}

export interface Question {
  correct_id: number;
  question: string;
  answer_choices: AnswerChoice[];
}

interface CreateQuestionFormProps {
  onChange: (question: Question) => void;
}

export const CreateQuestionForm = ({ onChange }: CreateQuestionFormProps) => {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [correctId, setCorrectId] = useState<number>(0);

  const updateParent = (
    newQuestion: string,
    newAnswers: string[],
    newCorrectId: number
  ) => {
    const formattedAnswers: AnswerChoice[] = newAnswers.map((ans, index) => ({
      answer_value: ans,
      answer_id: index,
    }));

    onChange({
      correct_id: newCorrectId,
      question: newQuestion,
      answer_choices: formattedAnswers,
    });
  };

  useEffect(() => {
    updateParent(question, answers, correctId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setQuestion(val);
    updateParent(val, answers, correctId);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    updateParent(question, newAnswers, correctId);
  };

  const handleCorrectIdChange = (index: number) => {
    setCorrectId(index);
    updateParent(question, answers, index);
  };

  return (
    <div className="flex flex-col gap-6 w-full bg-white/40 p-6 rounded-3xl border-2 border-[#8B4513]">
      <div className="flex flex-col gap-2">
        <label className="text-xl font-bold text-[#402100]">Question</label>
        <textarea
          value={question}
          onChange={handleQuestionChange}
          maxLength={300}
          placeholder="Enter your question here..."
          className="w-full p-4 rounded-2xl border-2 border-[#8B4513] bg-white/60 text-[#402100] text-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] transition-all resize-none h-32"
        />
        <div className="text-right text-sm text-[#402100]/70 font-medium">
          {question.length}/300
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-xl font-bold text-[#402100]">
          Answer Choices
        </label>
        <p className="text-[#402100]/80 text-sm -mt-2 mb-2">
          Check the box next to the correct answer.
        </p>
        {answers.map((answer, index) => (
          <div key={index} className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={correctId === index}
              onChange={() => handleCorrectIdChange(index)}
              className="w-6 h-6 accent-[#8B4513] cursor-pointer flex-shrink-0 mt-3"
            />
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="text"
                value={answer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                maxLength={150}
                placeholder={`Answer Choice ${index + 1}`}
                className="w-full p-3 rounded-xl border-2 border-[#8B4513] bg-white/60 text-[#402100] focus:outline-none focus:ring-2 focus:ring-[#8B4513] transition-all"
              />
              <div className="text-right text-xs text-[#402100]/70 font-medium">
                {answer.length}/150
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
