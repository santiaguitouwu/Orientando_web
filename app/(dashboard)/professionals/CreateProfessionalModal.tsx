"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const DOCUMENT_TYPES = ["CC", "TI", "CE", "PP", "RC"];

const EMPTY_FORM = {
  names: "",
  last_names: "",
  document_type: "CC",
  document_number: "",
  email: "",
  cellphone_number: "",
  cargo: "",
  whatsapp_number: "",
};

export default function CreateProfessionalModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest("/api/professionals/create", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear profesional");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-xl py-lg border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Nuevo Profesional</h3>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="create-pro-form" onSubmit={handleSubmit} className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">
          <div className="grid grid-cols-2 gap-md">
            <Field label="Nombres" required>
              <input className={inputCls} value={form.names} onChange={(e) => set("names", e.target.value)} required maxLength={100} />
            </Field>
            <Field label="Apellidos" required>
              <input className={inputCls} value={form.last_names} onChange={(e) => set("last_names", e.target.value)} required maxLength={100} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <Field label="Tipo de documento" required>
              <select className={inputCls} value={form.document_type} onChange={(e) => set("document_type", e.target.value)} required>
                {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Número de documento" required>
              <input className={inputCls} value={form.document_number} onChange={(e) => set("document_number", e.target.value)} required maxLength={20} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <Field label="Correo electrónico" required>
              <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required maxLength={255} />
            </Field>
            <Field label="Teléfono" required>
              <input className={inputCls} value={form.cellphone_number} onChange={(e) => set("cellphone_number", e.target.value)} required maxLength={15} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <Field label="Cargo" required>
              <input className={inputCls} value={form.cargo} onChange={(e) => set("cargo", e.target.value)} required maxLength={100} placeholder="ej. Psicólogo" />
            </Field>
            <Field label="WhatsApp" required>
              <input className={inputCls} value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} required maxLength={15} placeholder="ej. 3001234567" />
            </Field>
          </div>

          {error && (
            <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-sm px-xl py-lg border-t border-outline-variant">
          <button onClick={onClose} className="px-lg py-sm rounded-lg border border-outline-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            form="create-pro-form"
            disabled={loading}
            className="px-lg py-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-sm"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            Crear Profesional
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-base">
      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block">
        {label}{required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all";
