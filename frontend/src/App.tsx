import { ChatPanel } from "@/components/ChatPanel";
import { DocumentSidebar } from "@/components/DocumentSidebar";

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:flex-row">
      <DocumentSidebar />

      <section className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center rounded-full border-2 border-border bg-secondary px-3 py-1 text-xs font-bold tracking-wide text-secondary-foreground uppercase">
            Market intelligence
          </span>
          <h2 className="mt-3 font-display text-3xl leading-tight font-semibold sm:text-4xl">
            Research properties, markets, and housing reports with confidence
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Grounded answers with direct source support from your uploaded reports.
          </p>
        </div>

        <ChatPanel />
      </section>
    </main>
  );
}
