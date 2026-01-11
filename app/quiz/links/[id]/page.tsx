"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/Button";
import QRCode from "react-qr-code";

export default function Page() {
  const { id } = useParams();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const quizLink = `${origin}/quiz/take/${id}`;

  return (
    <div className="bg-[#fff3da] h-full min-h-dvh flex items-center justify-center">
      <main className="flex flex-col items-center gap-6">
        <p className="text-9xl mt-20">🎉</p>
        <p className="text-[#402100] text-2xl font-bold">
          Congratulations! You've created a quiz with Turdle!
        </p>
        <div className="flex flex-col gap-2 w-full h-full max-w-lg">
          <p className="text-[#402100] -mt-2 font-bold text-center">
            Your Quiz ID is {id}
          </p>
          <p className="text-[#402100] mt-5 font-bold text-center">
            Share this link with your friends:
          </p>
          <div className="flex flex-col items-center gap-2 h-full">
            <p className="flex-1 p-4 rounded-2xl border-2 border-[#8B4513] bg-white/50 text-[#402100] text-lg focus:outline-none">
              {quizLink}
            </p>
            <button
              className="px-8 py-3 mt-3
              bg-[#00b300]
              text-white
              rounded-2xl
              font-bold
                text-xl
                shadow-lg
                transition-all
                duration-200
                hover:scale-105
                hover:brightness-110
                active:scale-95
                active:brightness-90
                cursor-pointer
                w-40"
              onClick={() => {
                navigator.clipboard.writeText(quizLink);
              }}
            >
              Copy
            </button>
          </div>
        </div>

        <p className="text-[#402100] text-xl -mb-5 font-bold ">QR Code:</p>
        <QRCode value={quizLink} size={256} />

        <div className="mb-8 mt-3">
          <Button href="/" backgroundColor="#8B4513" textColor="#fff">
            Return Home
          </Button>
        </div>
      </main>
    </div>
  );
}
