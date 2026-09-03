import { CheckCircle2, TriangleAlert } from "lucide-react";

export type Status = { tone: "success" | "error"; message: string } | null;

export function StatusBanner({ status }: { status: Status }) {
  if (!status) return null;
  const isError = status.tone === "error";
  const Icon = isError ? TriangleAlert : CheckCircle2;

  return (
    <div role="status" className={isError ? "banner banner-error" : "banner banner-success"}>
      <Icon className="icon" />
      <span>{status.message}</span>
    </div>
  );
}
