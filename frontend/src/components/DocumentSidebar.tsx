import { useRef, useState } from "react";
import { FileText, Home, Loader2, UploadCloud } from "lucide-react";
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
    <aside className="panel sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Home className="icon-lg" />
        </span>
        <h1>Real Estate Investment Assistant</h1>
      </div>

      <div>
        <h2 className="section-title">Property Files</h2>
        <p className="muted section-copy">Upload PDF reports for this session, then ingest them for chat</p>
      </div>

      <button
        type="button"
        className="upload-zone"
        disabled={uploading || ingesting}
        onClick={() => inputRef.current?.click()}
      >
        <span className="upload-label">
          {uploading ? <Loader2 className="icon spin" /> : <UploadCloud className="icon" />}
          {uploading ? "Uploading PDFs..." : "Upload PDF Documents"}
        </span>
        <span className="upload-hint">
          Select one or more PDF files. They stay in this browser tab until you refresh.
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden-input"
        onChange={onPick}
      />

      <button
        type="button"
        className="button"
        disabled={ingesting || uploading || documents.length === 0}
        onClick={() => void onIngest()}
      >
        {ingesting ? (
          <>
            <Loader2 className="icon spin" /> Ingesting...
          </>
        ) : ingested ? (
          "Re-ingest Documents"
        ) : (
          "Ingest Documents"
        )}
      </button>

      <StatusBanner status={status} />

      <div className="doc-list">
        {documents.length === 0 ? (
          <p className="empty-docs">No documents uploaded yet.</p>
        ) : (
          documents.map((document) => (
            <div key={document.filename} className="doc-item">
              <FileText className="icon doc-icon" />
              <div className="doc-copy">
                <p className="doc-name">{document.filename}</p>
                <p className="doc-size">{formatSize(document.size)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
