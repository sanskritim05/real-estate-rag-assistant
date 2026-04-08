import { useEffect, useState } from "react";

function formatFileSize(sizeBytes) {
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentManager({ api }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchDocuments = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
      setHasLoadedOnce(true);
      return response.data;
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load document list.");
      setHasLoadedOnce(true);
      return [];
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDocuments({ silent: true });
  }, []);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    setIsUploading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post("/upload-documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000,
      });
      setDocuments((current) => {
        const merged = [...response.data.documents, ...current];
        const uniqueByName = new Map(merged.map((document) => [document.filename, document]));
        return Array.from(uniqueByName.values()).sort((left, right) =>
          left.filename.localeCompare(right.filename),
        );
      });
      setMessage(
        `${response.data.files_uploaded} file(s) uploaded successfully. Review them below, then click Ingest Documents.`,
      );
      setHasLoadedOnce(true);
      await fetchDocuments({ silent: true });
    } catch (requestError) {
      setError(
        requestError.code === "ECONNABORTED"
          ? "Upload took too long. Make sure the backend is running, then try again."
          : requestError.response?.data?.detail || "Upload failed.",
      );
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  };

  const handleIngest = async () => {
    setIsIngesting(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post("/ingest", {}, { timeout: 180000 });
      setMessage(
        `Ingestion complete. ${response.data.total_chunks_added} chunks added across ${response.data.documents_processed} updated document(s).`,
      );
      await fetchDocuments({ silent: true });
    } catch (requestError) {
      setError(
        requestError.code === "ECONNABORTED"
          ? "Ingestion is taking longer than expected. Please try again after confirming the backend is running."
          : requestError.response?.data?.detail || "Ingestion failed.",
      );
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-[#5D4A3C] bg-[rgba(255,248,240,0.06)] p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#E8D8C8]">Property Files</h3>
          <p className="mt-1 text-sm text-[#CDB8A5]">Upload PDF reports, then ingest them for chat</p>
        </div>
      </div>

      <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#8A725E] bg-[rgba(255,248,240,0.05)] px-4 py-5 text-center transition hover:border-[#C98D5B] hover:bg-[rgba(255,248,240,0.09)]">
        <span className="text-sm font-semibold text-[#FFF8F0]">
          {isUploading ? "Uploading PDFs..." : "Upload PDF Documents"}
        </span>
        <span className="mt-2 text-xs leading-5 text-[#CDB8A5]">
          Select one or more PDF files from your computer. They will be stored locally in this app.
        </span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={handleUpload}
          disabled={isUploading}
          className="sr-only"
        />
      </label>

      <button
        type="button"
        onClick={handleIngest}
        disabled={isIngesting || isUploading || !documents.length}
        className="mb-4 w-full rounded-2xl bg-[#C98D5B] px-4 py-3 text-sm font-semibold text-[#241912] transition hover:bg-[#B87C4A] disabled:cursor-not-allowed disabled:bg-[#9C8269]"
      >
        {isIngesting ? "Ingesting..." : "Ingest Documents"}
      </button>

      {message ? (
        <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-200/10 px-3 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-3 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#5C4B3D] bg-white/5 px-3 py-4 text-sm text-[#D7C5B5]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#8C6B51] border-t-[#F4E4D5]" />
          Loading documents...
        </div>
      ) : documents.length ? (
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.filename}
              className="rounded-2xl border border-[#5C4A3D] bg-[rgba(255,248,240,0.05)] px-3 py-3"
            >
              <p className="text-sm font-semibold text-[#FFF8F0]">{document.filename}</p>
              <p className="mt-1 text-xs text-[#CDB8A5]">{formatFileSize(document.size_bytes)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#6A5546] bg-white/5 px-4 py-5 text-sm text-[#D3BCAA]">
          No documents uploaded yet.
        </div>
      )}
    </section>
  );
}
