import { useState } from "react";
import { Plus, Copy, Trash2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Create() {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [pollLink, setPollLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const deleteOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreate = async () => {
    setMessage(null);

    const trimmedTitle = title.trim();
    const cleanedOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (!trimmedTitle) {
      return setMessage({
        type: "error",
        text: "Please enter a poll title.",
      });
    }

    if (cleanedOptions.length < 2) {
      return setMessage({
        type: "error",
        text: "At least two valid options are required.",
      });
    }

    const uniqueOptions = new Set(cleanedOptions);
    if (uniqueOptions.size !== cleanedOptions.length) {
      return setMessage({
        type: "error",
        text: "Duplicate options are not allowed.",
      });
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          options: cleanedOptions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return setMessage({
          type: "error",
          text: data.error || "Unable to create poll.",
        });
      }

      const link = `${window.location.origin}/vote/${data.pollId}`;
      setPollLink(link);

      setMessage({
        type: "success",
        text: "Poll created successfully. You can now share the link.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pollLink);
      setMessage({
        type: "success",
        text: "Poll link copied to clipboard.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "Unable to copy the link.",
      });
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 text-white">

        <h2 className="text-2xl font-semibold mb-6">Create a New Poll</h2>

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

        <input
          type="text"
          placeholder="Enter poll title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 mb-6 rounded-xl bg-white/20 placeholder-white/70 outline-none"
        />

        <div className="space-y-4">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1 p-3 rounded-full bg-white/20 placeholder-white/70 outline-none px-6"
              />

              <button
                onClick={() => deleteOption(index)}
                disabled={options.length <= 2}
                className={`p-2 rounded-full ${
                  options.length > 2
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {options.length < 10 && (
          <button
            onClick={addOption}
            className="flex items-center gap-2 mt-6 text-sm text-cyan-300 hover:text-cyan-400"
          >
            <Plus size={18} />
            Add Option
          </button>
        )}

        <div className="flex justify-between items-center mt-10">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-gradient-to-r from-green-400 to-emerald-600 px-8 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Poll"}
          </button>

          <button
            onClick={handleCopy}
            disabled={!pollLink}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition ${
                    pollLink
                      ? "bg-purple-500 hover:bg-purple-600"
                      : "bg-gray-500 cursor-not-allowed"
                  }`}
                >
            <Copy size={18} />
            <span>Copy Link</span>
          </button>
          
        </div>
      </div>
    </div>
  );
}
