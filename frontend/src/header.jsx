import { BarChart3 } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full bg-black/30 backdrop-blur-md text-white px-10 py-6">
      <div className="flex items-center gap-4">
        <BarChart3 className="w-8 h-8" />
        <h1 className="text-2xl md:text-3xl font-semibold tracking-wide">
          Real-Time Polls
        </h1>
      </div>
    </header>
  );
}
