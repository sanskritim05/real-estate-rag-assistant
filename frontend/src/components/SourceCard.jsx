import { useState } from "react";

function truncate(text, limit = 180) {
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function formatPages(pages) {
  if (!pages.length) {
    return "Page not available";
  }

  if (pages.length === 1) {
    return `Page ${pages[0]}`;
  }

  return `Pages ${pages.join(", ")}`;
}

export default function SourceCard({ source }) {
  const [expanded, setExpanded] = useState(false);
  const previewText = source.references[0]?.chunk_text || "";

  return (
    <button
      type="button"
      onClick={() => setExpanded((value) => !value)}
      className="w-full rounded-2xl border border-[#E8DCCC] bg-[#FBF6EF] px-4 py-3 text-left shadow-sm transition hover:border-[#D7C2AA]"
    >
      <div className="border-l-4 border-[#BE8A57] pl-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-bold text-[#392D25]">{source.filename}</p>
          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-[#826D58]">
            {formatPages(source.pages)}
          </span>
        </div>

        {expanded ? (
          <div className="mt-3 space-y-3">
            {source.references.map((reference, index) => (
              <div key={`${reference.page}-${index}`} className="rounded-2xl bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9D866F]">
                  Page {reference.page}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#5E4B3E]">{reference.chunk_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[#5E4B3E]">{truncate(previewText)}</p>
        )}

        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#AA927A]">
          {expanded ? "Click to collapse" : "Click to expand"}
        </p>
      </div>
    </button>
  );
}
