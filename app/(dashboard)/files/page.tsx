"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";

interface Archivo {
  id: number;
  nombre: string;
  descripcion: string | null;
  url: string;
  clave: string;
  activo: boolean;
  creation_date: string;
  update_date: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editFile, setEditFile] = useState<Archivo | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<Archivo[]>("/api/files");
      setFiles(res.data ?? []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const filtered = files.filter((f) => {
    const q = search.toLowerCase();
    return !q || f.nombre.toLowerCase().includes(q) || f.clave.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto p-lg bg-background custom-scrollbar">

      {/* Header */}
      <div className="mb-xl">
        <h3 className="font-display-lg text-display-lg text-on-surface">Archivos</h3>
        <p className="text-on-surface-variant font-body-md text-body-md mt-base">
          Documentos y URLs para enviar a los clientes desde el chatbot via N8N.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-lg max-w-sm">
        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          className="w-full pl-xl pr-md py-sm bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
          placeholder="Buscar por nombre o clave…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            {loading ? "Cargando…" : `${filtered.length} archivo${filtered.length !== 1 ? "s" : ""}`}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            N8N usa <code className="bg-surface-container px-xs py-0.5 rounded font-mono text-[11px]">GET /api/files/key/:clave</code>
          </span>
        </div>

        {loading ? (
          <div className="py-2xl text-center text-on-surface-variant font-body-md text-body-md">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-2xl text-center text-on-surface-variant font-body-md text-body-md">
            {search ? "No se encontraron archivos." : "No hay archivos registrados aún."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant font-label-md text-label-md">
                  {["Nombre", "Clave N8N", "URL", "Acciones"].map((h) => (
                    <th key={h} className="px-lg py-md border-b border-outline-variant whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onEdit={() => setEditFile(file)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editFile && (
        <FileModal
          file={editFile}
          onClose={() => setEditFile(null)}
          onSaved={() => { setEditFile(null); fetchFiles(); }}
        />
      )}
    </div>
  );
}

/* ─── Row ─────────────────────────────────────────────────────────────────── */

interface RowProps {
  file: Archivo;
  onEdit: () => void;
}

function FileRow({ file, onEdit }: RowProps) {
  const [copied, setCopied] = useState(false);

  function copyKey() {
    navigator.clipboard.writeText(file.clave);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <tr className="hover:bg-surface-container-low transition-colors">

      <td className="px-lg py-md">
        <p className="font-body-md text-body-md text-on-surface font-semibold">{file.nombre}</p>
        {file.descripcion && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 max-w-[220px] truncate">{file.descripcion}</p>
        )}
      </td>

      <td className="px-lg py-md">
        <div className="flex items-center gap-xs">
          <code className="bg-surface-container px-sm py-0.5 rounded font-mono text-[12px] text-on-surface">{file.clave}</code>
          <button
            onClick={copyKey}
            title="Copiar clave"
            className="p-0.5 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[15px]">{copied ? "check" : "content_copy"}</span>
          </button>
        </div>
      </td>

      <td className="px-lg py-md">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-xs text-secondary hover:underline font-body-sm text-body-sm max-w-[300px]"
          title={file.url}
        >
          <span className="material-symbols-outlined text-[15px] flex-shrink-0">open_in_new</span>
          <span className="truncate">{file.url}</span>
        </a>
      </td>

      <td className="px-lg py-md">
        <button
          onClick={onEdit}
          className="p-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
          title="Editar"
        >
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>
      </td>
    </tr>
  );
}

/* ─── Modal ───────────────────────────────────────────────────────────────── */

interface ModalProps {
  file: Archivo;
  onClose: () => void;
  onSaved: () => void;
}

function FileModal({ file, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState({
    nombre:      file.nombre,
    descripcion: file.descripcion ?? "",
    url:         file.url,
    clave:       file.clave,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClaveInput(raw: string) {
    set("clave", raw.toLowerCase().replace(/[^a-z0-9_-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      await apiRequest("/api/files/update", {
        method: "PATCH",
        body: JSON.stringify({
          id:          Number(file.id),
          nombre:      form.nombre,
          descripcion: form.descripcion || null,
          url:         form.url,
          clave:       form.clave,
        }),
      });
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">

        <div className="flex items-start justify-between px-xl py-lg border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Editar archivo</h3>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="file-form" onSubmit={handleSubmit} className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">

          <div className="space-y-base">
            <label className={labelCls}>Nombre <span className="text-error">*</span></label>
            <input className={inputCls} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required maxLength={200} />
          </div>

          <div className="space-y-base">
            <label className={labelCls}>Descripción</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} maxLength={500} />
          </div>

          <div className="space-y-base">
            <label className={labelCls}>URL del documento <span className="text-error">*</span></label>
            <input className={inputCls} type="url" value={form.url} onChange={(e) => set("url", e.target.value)} required />
            <p className="font-body-sm text-body-sm text-on-surface-variant">Enlace de Google Drive, OneDrive u otro servicio similar.</p>
          </div>

          <div className="space-y-base">
            <label className={labelCls}>Clave N8N <span className="text-error">*</span></label>
            <input
              className={inputCls}
              value={form.clave}
              onChange={(e) => handleClaveInput(e.target.value)}
              required
              maxLength={100}
            />
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              N8N usa <code className="bg-surface-container px-xs rounded font-mono text-[11px]">GET /api/files/key/{form.clave || "clave"}</code>
            </p>
          </div>

          {saveError && (
            <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {saveError}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-sm px-xl py-lg border-t border-outline-variant">
          <button onClick={onClose} className="px-lg py-sm rounded-lg border border-outline-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            form="file-form"
            disabled={saving}
            className="px-lg py-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-sm"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            Guardar cambios
          </button>
        </div>

      </div>
    </div>
  );
}

const inputCls = "w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all";
const labelCls = "font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block";