import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ChatWindow from "./components/ChatWindow";
import DocumentManager from "./components/DocumentManager";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
});

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.5V20h11V10.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAsk = async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/ask", { question: trimmed });
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.data.answer,
        sources: response.data.sources ?? [],
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (requestError) {
      const detail =
        requestError.code === "ECONNABORTED"
          ? "The request took too long. Make sure the backend is running, documents are ingested, and your Groq key is set."
          : requestError.response?.data?.detail ||
            "The assistant could not answer right now. Check that the backend is running and your Groq key is set.";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="min-h-screen bg-[#EFE7DB] text-slate-900 lg:flex lg:h-screen lg:overflow-hidden">
      <aside className="flex shrink-0 flex-col bg-[linear-gradient(180deg,#3F3027_0%,#241B16_100%)] px-5 py-6 text-[#F8F2EA] shadow-2xl lg:h-screen lg:w-[320px] lg:overflow-y-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C98D5B]/20 ring-1 ring-[#E9C5A2]/20 backdrop-blur">
            <HouseIcon />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#FFF7EF]">Real Estate Investment Assistant</h1>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5">
          <DocumentManager api={api} />
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(201,141,91,0.17),_transparent_38%),linear-gradient(180deg,#FCFAF7_0%,#F4EEE6_100%)] lg:h-screen lg:min-h-0 lg:overflow-hidden">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:min-h-0 lg:px-10">
          <div className="mx-auto flex h-full max-w-5xl flex-col lg:min-h-0">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A07A52]">Market intelligence</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#2B211B]">
                Research properties, markets, and housing reports with confidence
              </h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#6B5644]">
                Grounded answers with direct source support from your uploaded reports.
              </p>
            </div>
            <div className="flex flex-1 flex-col rounded-[32px] border border-[#E4D8CC] bg-[rgba(255,252,248,0.78)] shadow-panel backdrop-blur lg:min-h-0">
              <ChatWindow messages={messages} isLoading={isLoading} />

              <div className="border-t border-[#E6DACB] bg-[#FCF8F3]/95 p-4">
                {error ? (
                  <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <div className="flex items-end gap-3 rounded-[28px] border border-[#E5D8C7] bg-white p-3 shadow-panel">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about market trends, rent growth, inventory shifts, or where the reports disagree..."
                    className="max-h-40 min-h-[52px] flex-1 resize-none bg-transparent px-3 py-3 text-[15px] text-[#352921] outline-none placeholder:text-[#A58E78]"
                  />
                  <button
                    type="button"
                    onClick={handleAsk}
                    disabled={isLoading || !question.trim()}
                    className="rounded-2xl bg-[#6C4B33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5D3F2B] disabled:cursor-not-allowed disabled:bg-[#CBBBAA]"
                  >
                    {isLoading ? "Thinking..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
