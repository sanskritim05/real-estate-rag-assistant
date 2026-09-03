import { CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status = { tone: "success" | "error"; message: string } | null;

export function StatusBanner({ status, className }: { status: Status; className?: string }) {
  if (!status) return null;
  const isError = status.tone === "error";
  const Icon = isError ? TriangleAlert : CheckCircle2;
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-medium",
        isError
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-success/40 bg-success/10 text-success",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span className="leading-snug">{status.message}</span>
    </div>
  );
}
