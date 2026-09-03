import { useRef, useState } from "react";
import { FileText, Home, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBanner, type Status } from "@/components/StatusBanner";
import { formatSize } from "@/lib/api";
import { filesToDocuments, ingestDocuments, mergeDocuments, type SessionDocument } from "@/lib/pdf";

type DocumentSidebarProps = {
  documents: SessionDocument[];
  ingested: boolean;
  onDocumentsChange: (documents: SessionDocument[]) => void;
  onIngestedChange: (ingested: boolean) => void;
};

export function DocumentSidebar({
  documents,
  ingested,
  onDocumentsChange,
  onIngestedChange,
}: DocumentSidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) {
      return;
    }

    setUploading(true);
    setStatus(null);
    try {
      const incoming = filesToDocuments(files);
      onDocumentsChange(mergeDocuments(documents, incoming));
      onIngestedChange(false);
      setStatus({
        tone: "success",
        message: `${files.length} file(s) uploaded successfully. Review them below, then click Ingest Documents.`,
      });
    } catch (err) {
      setStatus({
        tone: "error",
        message: `Upload failed. ${err instanceof Error ? err.message : ""}`.trim(),
      });
    } finally {
      setUploading(false);
    }
  };

  const onIngest = async () => {
    setIngesting(true);
    setStatus(null);
    try {
      const result = await ingestDocuments(documents);
      onDocumentsChange(result.documents);
      onIngestedChange(true);
      setStatus({
        tone: "success",
        message: `Ingestion complete. ${result.chunks} chunks added across ${result.docs} updated document(s).`,
      });
    } catch (err) {
      onIngestedChange(false);
      setStatus({
        tone: "error",
        message:
          err instanceof Error
            ? `Ingestion failed. ${err.message}`
            : "Ingestion failed. Please try another PDF.",
      });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <aside className="card-cute flex flex-col gap-5 p-5 lg:h-[calc(100vh-3rem)] lg:w-[22rem] lg:shrink-0 lg:overflow-y-auto">
      <div className="flex items-center gap-3">
        <span className="animate-bob grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <Home className="size-5" />
        </span>
        <h1 className="font-display text-lg leading-tight font-semibold">
          Real Estate Investment Assistant
        </h1>
      </div>

      <div>
        <h2 className="text-base font-bold">Property Files</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload PDF reports for this session, then ingest them for chat
        </p>
      </div>

      <button
        type="button"
        disabled={uploading || ingesting}
        onClick={() => inputRef.current?.click()}
        className="group rounded-2xl border-2 border-dashed border-primary/45 bg-accent/40 p-4 text-left transition-colors hover:bg-accent/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center gap-2 font-bold text-primary">
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UploadCloud className="size-4 transition-transform group-hover:-translate-y-0.5" />
          )}
          {uploading ? "Uploading PDFs..." : "Upload PDF Documents"}
        </span>
        <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
          Select one or more PDF files. They stay in this browser tab until you refresh.
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={onPick}
      />

      <Button
        className="w-full rounded-2xl border-2 border-border text-base font-bold shadow-soft"
        disabled={ingesting || uploading || documents.length === 0}
        onClick={() => void onIngest()}
      >
        {ingesting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Ingesting...
          </>
        ) : ingested ? (
          "Re-ingest Documents"
        ) : (
          "Ingest Documents"
        )}
      </Button>

      <StatusBanner status={status} />

      <div className="flex flex-col gap-2">
        {documents.length === 0 ? (
          <p className="rounded-2xl bg-muted px-3 py-6 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        ) : (
          documents.map((document) => (
            <div
              key={document.filename}
              className="lift-hover animate-pop-in flex items-center gap-3 rounded-2xl border-2 border-border bg-background/60 px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{document.filename}</p>
                <p className="text-xs text-muted-foreground">{formatSize(document.size)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
