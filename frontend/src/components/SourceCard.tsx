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
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className="lift-hover animate-pop-in w-full rounded-2xl border-2 border-border bg-background/70 p-3 text-left hover:bg-accent/40"
    >
      <div className="flex items-center gap-2">
        <FileText className="size-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-bold">{group.filename}</span>
        <span className="ml-auto shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
          {pageLabel(group.items)}
        </span>
      </div>

      {open ? (
        <div className="mt-2 space-y-2">
          {group.items.map((item, index) => (
            <div key={`${item.filename}-${item.page}-${index}`} className="rounded-xl bg-muted p-2">
              <p className="text-[11px] font-bold text-muted-foreground">
                {item.page ? `Page ${item.page}` : "Page not available"}
              </p>
              <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap">{item.chunk_text}</p>
            </div>
          ))}
          <p className="text-[11px] font-semibold text-primary">Click to collapse</p>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {preview}
            {(group.items[0]?.chunk_text ?? "").length > 180 ? "..." : ""}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-primary">Click to expand</p>
        </div>
      )}
    </button>
  );
}
