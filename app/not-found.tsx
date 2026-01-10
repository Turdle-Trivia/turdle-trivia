import Link from "next/link";
import { Button } from "../components/Button";

export default function NotFound() {
  return (
    <div className="bg-[#fff3da] h-dvh flex flex-col items-center justify-center gap-6">
      <img className="h-50" src="/turdle-logo.png" alt="Turdle logo" />
      <h1 className="text-3xl font-bold text-[#402100] text-center px-4">
        Sorry, this page doesn't exist (yet!)
      </h1>
      <Link href="/">
        <Button backgroundColor="#8B4513" textColor="#fff">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
