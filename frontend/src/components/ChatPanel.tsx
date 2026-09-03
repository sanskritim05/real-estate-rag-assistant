import { useEffect, useRef, useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBanner, type Status } from "@/components/StatusBanner";
import { SourceCard, groupSources } from "@/components/SourceCard";
import { askQuestion, TimeoutError, type SourceItem } from "@/lib/api";
import { retrieveChunks } from "@/lib/retrieve";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 rounded-3xl border-2 border-border bg-card px-4 py-3 shadow-soft">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="typing-dot size-2 rounded-full bg-primary"
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function AssistantExtras({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const groups = groupSources(message.sources ?? []);

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full border-2 border-border text-xs font-bold"
          onClick={() => {
            void navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>

        {groups.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full border-2 border-border text-xs font-bold"
            onClick={() => setShowSources((value) => !value)}
          >
            {showSources ? "Hide Sources" : "Show Sources"}
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
              {groups.length}
            </span>
          </Button>
        )}
      </div>

      {showSources && (
        <div className="space-y-2">
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
    <div className="card-cute flex min-h-[32rem] flex-1 flex-col overflow-hidden">
      <div className="paper-dots flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 && !waiting && (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Ask anything about your uploaded reports - answers come straight from the pages.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("animate-pop-in flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div className={cn("max-w-[85%]", message.role === "user" && "flex flex-col items-end")}>
              <div
                className={cn(
                  "rounded-3xl border-2 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-soft",
                  message.role === "user"
                    ? "rounded-br-lg border-border bg-primary text-primary-foreground"
                    : "rounded-bl-lg border-border bg-card text-card-foreground",
                )}
              >
                {message.content}
              </div>
              {message.role === "assistant" && <AssistantExtras message={message} />}
            </div>
          </div>
        ))}

        {waiting && (
          <div className="flex justify-start">
            <TypingDots />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t-2 border-border bg-muted/50 p-3 sm:p-4">
        <StatusBanner status={error} />
        <div className="flex items-end gap-2">
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
            className="max-h-44 flex-1 resize-none rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary"
          />
          <Button
            className="h-12 rounded-2xl border-2 border-border px-5 font-bold shadow-soft"
            disabled={waiting || input.trim().length === 0}
            onClick={() => void send()}
          >
            {waiting ? "Thinking..." : <>Send <Send className="size-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
