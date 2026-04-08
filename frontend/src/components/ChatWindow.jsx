import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

function TypingIndicator() {
  return (
    <div className="flex max-w-[75%] items-center gap-2 rounded-3xl rounded-bl-md border border-[#E3D7CA] bg-[#FFFDFC] px-4 py-3 shadow-soft">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#B99879] [animation-delay:-0.2s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#B99879] [animation-delay:-0.1s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#B99879]" />
    </div>
  );
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-hidden lg:min-h-0">
      <div className="h-full space-y-4 overflow-y-auto px-5 py-5 lg:px-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
