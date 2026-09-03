import { useEffect, useRef, useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { StatusBanner, type Status } from "@/components/StatusBanner";
import { SourceCard, groupSources } from "@/components/SourceCard";
import { askQuestion, TimeoutError, type SourceItem } from "@/lib/api";
import { retrieveChunks } from "@/lib/retrieve";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
};

function TypingDots() {
  return (
    <div className="typing">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

function AssistantExtras({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const groups = groupSources(message.sources ?? []);

  return (
    <div className="assistant-extras">
      <div className="extra-actions">
        <button
          type="button"
          className="chip-button"
          onClick={() => {
            void navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="icon" /> : <Copy className="icon" />}
          {copied ? "Copied" : "Copy"}
        </button>

        {groups.length > 0 && (
          <button type="button" className="chip-button" onClick={() => setShowSources((value) => !value)}>
            {showSources ? "Hide Sources" : "Show Sources"}
            <span className="count-pill">{groups.length}</span>
          </button>
        )}
      </div>

      {showSources && (
        <div className="source-stack">
          {groups.map((group) => (
            <SourceCard key={group.filename} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatPanel({ chunks }: { chunks: SourceItem[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<Status>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, waiting]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const send = async () => {
    const question = input.trim();
    if (!question || waiting) return;
    setInput("");
    setError(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: question }]);
    setWaiting(true);
    try {
      const res = await askQuestion(question, retrieveChunks(question, chunks));
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.answer,
          sources: res.sources ?? [],
        },
      ]);
    } catch (err) {
      setError({
        tone: "error",
        message:
          err instanceof TimeoutError
            ? "The request took too long. Make sure documents are ingested and GROQ_API_KEY is set."
            : `The assistant could not answer right now. Check that GROQ_API_KEY is set.${
                err instanceof Error && err.message ? ` (${err.message})` : ""
              }`,
      });
    } finally {
      setWaiting(false);
    }
  };

  return (
    <div className="panel chat-panel">
      <div className="transcript">
        {messages.length === 0 && !waiting && (
          <div className="empty-chat">
            <p>Ask anything about your uploaded reports - answers come straight from the pages.</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "row row-user" : "row row-assistant"}>
            <div className={message.role === "user" ? "bubble-wrap bubble-wrap-user" : "bubble-wrap"}>
              <div className={message.role === "user" ? "bubble bubble-user" : "bubble bubble-assistant"}>
                {message.content}
              </div>
              {message.role === "assistant" && <AssistantExtras message={message} />}
            </div>
          </div>
        ))}

        {waiting && (
          <div className="row row-assistant">
            <TypingDots />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="composer">
        <StatusBanner status={error} />
        <div className="composer-row">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Ask about market trends, rent growth, inventory shifts, or where the reports disagree..."
            className="question-box"
          />
          <button
            type="button"
            className="button send-button"
            disabled={waiting || input.trim().length === 0}
            onClick={() => void send()}
          >
            {waiting ? (
              "Thinking..."
            ) : (
              <>
                Send <Send className="icon" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
