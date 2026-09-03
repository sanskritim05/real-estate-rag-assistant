import { useEffect, useRef, useState } from "react";
import { FileText, Home, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBanner, type Status } from "@/components/StatusBanner";
import {
  formatSize,
  ingestDocuments,
  listDocuments,
  TimeoutError,
  uploadDocuments,
  type DocumentItem,
} from "@/lib/api";

export function DocumentSidebar() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      setDocs(await listDocuments());
    } catch {
      setStatus({ tone: "error", message: "Could not load your documents. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setStatus(null);
    try {
      await uploadDocuments(files);
      await refresh();
      setStatus({
        tone: "success",
        message: `${files.length} file(s) uploaded successfully. Review them below, then click Ingest Documents.`,
      });
    } catch (err) {
      setStatus({
        tone: "error",
        message:
          err instanceof TimeoutError
            ? "The upload took too long and timed out. Please try again."
            : `Upload failed. ${err instanceof Error ? err.message : ""}`.trim(),
      });
    } finally {
      setUploading(false);
    }
  };

  const onIngest = async () => {
    setIngesting(true);
    setStatus(null);
    try {
      const { chunks, docs: updated } = await ingestDocuments();
      setStatus({
        tone: "success",
        message: `Ingestion complete. ${chunks} chunks added across ${updated} updated document(s).`,
      });
    } catch (err) {
      setStatus({
        tone: "error",
        message:
          err instanceof TimeoutError
            ? "Ingestion took too long and timed out. Please try again."
            : `Ingestion failed. ${err instanceof Error ? err.message : ""}`.trim(),
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
          Upload PDF reports, then ingest them for chat
        </p>
      </div>

      <button
        type="button"
        disabled={uploading}
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
          Select one or more PDF files from your computer. They will be stored locally in this app.
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
        disabled={ingesting || uploading || docs.length === 0}
        onClick={onIngest}
      >
        {ingesting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Ingesting...
          </>
        ) : (
          "Ingest Documents"
        )}
      </Button>

      <StatusBanner status={status} />

      <div className="flex flex-col gap-2">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading documents...
          </p>
        ) : docs.length === 0 ? (
          <p className="rounded-2xl bg-muted px-3 py-6 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.filename}
              className="lift-hover animate-pop-in flex items-center gap-3 rounded-2xl border-2 border-border bg-background/60 px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{doc.filename}</p>
                <p className="text-xs text-muted-foreground">{formatSize(doc.size)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
