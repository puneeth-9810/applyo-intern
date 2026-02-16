import { useNavigate } from "react-router-dom";
import { Plus, FileText } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-1 items-center justify-center w-full px-6">
      <div className="flex flex-col md:flex-row gap-12 md:gap-24">

        <button
          type="button"
          onClick={() => navigate("/create")}
          className="w-56 h-56 rounded-3xl 
                     bg-gradient-to-br from-cyan-400 to-blue-600
                     text-white text-xl font-semibold
                     flex flex-col items-center justify-center
                     shadow-xl
                     hover:scale-105 hover:shadow-2xl
                     transition-all duration-300"
        >
          <Plus className="w-12 h-12 mb-4" />
          Create Poll
        </button>

        <button
          type="button"
          onClick={() => navigate("/vote")}
          className="w-56 h-56 rounded-3xl 
                     bg-gradient-to-br from-pink-400 to-purple-600
                     text-white text-xl font-semibold
                     flex flex-col items-center justify-center
                     shadow-xl
                     hover:scale-105 hover:shadow-2xl
                     transition-all duration-300"
        >
          <FileText className="w-12 h-12 mb-4" />
          Vote in Poll
        </button>

      </div>
    </section>
  );
}
