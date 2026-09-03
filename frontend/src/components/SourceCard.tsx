import { useState } from "react";
import { FileText } from "lucide-react";
import type { SourceItem } from "@/lib/api";

export type GroupedSource = { filename: string; items: SourceItem[] };

export function groupSources(sources: SourceItem[]): GroupedSource[] {
  const map = new Map<string, SourceItem[]>();
  for (const source of sources) {
    const list = map.get(source.filename) ?? [];
    list.push(source);
    map.set(source.filename, list);
  }
  return [...map.entries()].map(([filename, items]) => ({ filename, items }));
}

function pageLabel(items: SourceItem[]) {
  const pages = [...new Set(items.map((item) => item.page).filter((page) => page !== null && page !== undefined && page !== ""))];
  if (pages.length === 0) return "Page not available";
  if (pages.length === 1) return `Page ${pages[0]}`;
  return `Pages ${pages.join(", ")}`;
}

export function SourceCard({ group }: { group: GroupedSource }) {
  const [open, setOpen] = useState(false);
  const preview = (group.items[0]?.chunk_text ?? "").slice(0, 180);

  return (
    <button type="button" className="source-card" onClick={() => setOpen((value) => !value)}>
      <div className="source-head">
        <FileText className="icon doc-icon" />
        <span className="source-name">{group.filename}</span>
        <span className="page-pill">{pageLabel(group.items)}</span>
      </div>

      {open ? (
        <div className="source-full">
          {group.items.map((item, index) => (
            <div key={`${item.filename}-${item.page}-${index}`} className="excerpt">
              <p className="excerpt-label">{item.page ? `Page ${item.page}` : "Page not available"}</p>
              <p className="excerpt-text">{item.chunk_text}</p>
            </div>
          ))}
          <p className="source-hint">Click to collapse</p>
        </div>
      ) : (
        <div className="source-preview">
          <p className="preview-text">
            {preview}
            {(group.items[0]?.chunk_text ?? "").length > 180 ? "..." : ""}
          </p>
          <p className="source-hint">Click to expand</p>
        </div>
      )}
    </button>
  );
}
