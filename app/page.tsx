import Image from "next/image";
import { Button } from "../components/Button";

export default function Home() {
  return (
    <div className="bg-[#fff3da] h-dvh flex items-center justify-center">
      <main className="flex flex-col items-center gap-6">
        <img className="h-50" src="/turdle-logo.png" alt="Turdle logo" />
        <p className="text-[#402100] -mt-8 font-bold">
          Answer questions. Unlock necessities.
        </p>
        <div className="flex gap-6 md:gap-10">
          <Button backgroundColor="#8B4513" textColor="#fff" href="/quiz">
            Take a Quiz
          </Button>
          <Button backgroundColor="#00b300" textColor="#fff" href="/create">
            Create a Quiz
          </Button>
        </div>
      </main>
    </div>
  );
}
