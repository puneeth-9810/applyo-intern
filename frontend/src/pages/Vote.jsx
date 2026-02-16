import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

export default function Vote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [pollData, setPollData] = useState(null);
  const [pollInput, setPollInput] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [message, setMessage] = useState(null);

  const getOrCreateToken = () => {
    const key = `poll_token_${id}`;
    let token = localStorage.getItem(key);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(key, token);
    }
    return token;
  };

  const calculateTotal = (options) => {
    setTotalVotes(options.reduce((sum, opt) => sum + opt.votes, 0));
  };

  const fetchPoll = async (pollId) => {
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/polls/${pollId}`);
      const data = await response.json();

      if (!response.ok) {
        return setMessage({ type: "error", text: "Poll not found." });
      }

      setPollData(data);
      calculateTotal(data.options);

      if (localStorage.getItem(`poll_token_${pollId}`)) {
        setHasVoted(true);
      }
    } catch {
      setMessage({ type: "error", text: "Unable to load poll." });
    }
  };

  useEffect(() => {
    socketRef.current = io(API_URL);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    fetchPoll(id);

    socketRef.current.emit("joinPoll", id);

    socketRef.current.on("voteUpdate", (updatedOptions) => {
      setPollData((prev) => ({
        ...prev,
        options: updatedOptions,
      }));
      calculateTotal(updatedOptions);
    });

    return () => {
      socketRef.current.off("voteUpdate");
    };
  }, [id]);

  const handleSearch = () => {
    if (!pollInput) return;
    const extractedId = pollInput.includes("/vote/")
      ? pollInput.split("/vote/")[1]
      : pollInput;
    navigate(`/vote/${extractedId}`);
  };

  const handleVote = async () => {
    if (!selectedOption || hasVoted) return;

    setHasVoted(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/polls/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId: selectedOption,
          voterToken: getOrCreateToken(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setPollData((prev) => ({
        ...prev,
        options: data.options,
      }));

      calculateTotal(data.options);

      setMessage({ type: "success", text: "Your vote has been recorded." });
    } catch {
      setHasVoted(false);
      setMessage({
        type: "error",
        text: "Unable to submit vote. Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 text-white">

        {message && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm ${
              message.type === "error"
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {!pollData && (
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Paste poll link or ID"
              value={pollInput}
              onChange={(e) => setPollInput(e.target.value)}
              className="flex-1 p-4 rounded-full bg-white/20 outline-none px-6"
            />
            <button
              onClick={handleSearch}
              className="bg-purple-500 p-4 rounded-full hover:bg-purple-600"
            >
              <Search size={20} />
            </button>
          </div>
        )}

        {pollData && (
          <>
            <h2 className="text-3xl font-semibold mb-8">
              {pollData.poll.title}
            </h2>

            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-4">
                {pollData.options.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`p-4 rounded-full cursor-pointer ${
                      selectedOption === option.id
                        ? "bg-cyan-600"
                        : "bg-cyan-500 hover:bg-cyan-600"
                    }`}
                  >
                    {option.text}
                  </div>
                ))}

                <button
                  disabled={hasVoted}
                  onClick={handleVote}
                  className={`mt-6 w-full py-3 rounded-xl font-semibold ${
                    hasVoted
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {hasVoted ? "Vote Submitted" : "Submit Vote"}
                </button>
              </div>

              <div className="space-y-6">
                {pollData.options.map((option) => {
                  const percentage =
                    totalVotes === 0
                      ? 0
                      : (option.votes / totalVotes) * 100;

                  return (
                    <div key={option.id}>
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span>{option.text}</span>
                        <span>{option.votes} votes</span>
                      </div>

                      <div className="w-full bg-white/20 h-6 rounded-full overflow-hidden">
                        <div
                          className="bg-pink-500 h-6 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="text-right text-lg font-semibold">
                  Total Votes: {totalVotes}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
