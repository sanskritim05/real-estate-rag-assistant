import { useMemo, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import type { SessionDocument } from "@/lib/pdf";

export default function App() {
  const [documents, setDocuments] = useState<SessionDocument[]>([]);
  const [ingested, setIngested] = useState(false);
  const chunks = useMemo(
    () => (ingested ? documents.flatMap((document) => document.chunks) : []),
    [documents, ingested],
  );

  return (
    <main className="app-shell">
      <DocumentSidebar
        documents={documents}
        ingested={ingested}
        onDocumentsChange={setDocuments}
        onIngestedChange={setIngested}
      />

      <section className="workspace">
        <div className="hero">
          <span className="eyebrow">Market intelligence</span>
          <h2>Research properties, markets, and housing reports with confidence</h2>
          <p className="hero-copy">
            Grounded answers with direct source support from your uploaded reports. Files stay in this tab until you refresh.
          </p>
        </div>

        <ChatPanel chunks={chunks} />
      </section>
    </main>
  );
}
