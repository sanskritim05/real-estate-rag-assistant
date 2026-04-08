import { useState } from "react";
import SourceCard from "./SourceCard";

function groupSourcesByDocument(sources) {
  const grouped = new Map();

  sources.forEach((source) => {
    const filename = source.filename || "Unknown";
    const existing = grouped.get(filename);

    if (existing) {
      existing.references.push(source);
      existing.pages.add(source.page);
      return;
    }

    grouped.set(filename, {
      filename,
      references: [source],
      pages: new Set([source.page]),
    });
  });

  return Array.from(grouped.values()).map((source) => ({
    filename: source.filename,
    pages: Array.from(source.pages).sort((left, right) => Number(left) - Number(right)),
    references: source.references,
  }));
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const groupedSources = groupSourcesByDocument(message.sources ?? []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-3xl rounded-br-md bg-[#EAD8C4] px-4 py-3 text-sm leading-7 text-[#3C3027] shadow-soft">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-3xl rounded-bl-md border border-[#E5D9CC] bg-[#FFFDFC] px-4 py-4 text-sm text-[#342A23] shadow-soft">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="whitespace-pre-wrap leading-7">{message.content}</div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-xl border border-[#E1D4C6] px-3 py-2 text-xs font-semibold text-[#6B5644] transition hover:border-[#D1BEAB] hover:bg-[#F8F3ED]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {groupedSources.length ? (
          <div className="border-t border-[#F1E8DE] pt-3">
            <button
              type="button"
              onClick={() => setSourcesOpen((value) => !value)}
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5E4B3D]"
            >
              <span>{sourcesOpen ? "Hide" : "Show"} Sources</span>
              <span className="rounded-full bg-[#F5EEE6] px-2 py-0.5 text-xs text-[#826A57]">
                {groupedSources.length}
              </span>
            </button>

            {sourcesOpen ? (
              <div className="space-y-3">
                {groupedSources.map((source) => (
                  <SourceCard key={source.filename} source={source} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
