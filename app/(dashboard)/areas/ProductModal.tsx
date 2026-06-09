"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

export interface ProfesionalAsignado {
  profesional_id: number;
  nombres: string;
  apellidos: string;
  cargo: string;
  numero_whatsapp: string;
}

export interface ProductNode {
  id: number;
  nombre: string;
  descripcion: string | null;
  duracion: number;
  es_agendable_por_bot: boolean;
  padre_id: number | null;
  nivel: number;
  tiene_hijos: boolean;
  profesionales: ProfesionalAsignado[];
}

interface Props {
  mode: "create" | "edit";
  nivel: 1 | 2 | 3;
  parentId?: number;
  parentName?: string;
  product?: ProductNode;
  onClose: () => void;
  onSaved: () => void;
}

const NIVEL_LABELS: Record<number, string> = { 1: "Área", 2: "Sub-área", 3: "Servicio" };

export default function ProductModal({ mode, nivel, parentId, parentName, product, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    nombre: product?.nombre ?? "",
    descripcion: product?.descripcion ?? "",
    duracion: product?.duracion ?? 0,
    agendable_bot: product?.es_agendable_por_bot ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function set(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      if (mode === "create") {
        await apiRequest("/api/products/create", {
          method: "POST",
          body: JSON.stringify({
            nombre: form.nombre,
            descripcion: form.descripcion || null,
            duracion: form.agendable_bot ? Number(form.duracion) : 0,
            agendable_bot: form.agendable_bot,
            padre_id: parentId != null ? Number(parentId) : null,
          }),
        });
      } else {
        await apiRequest("/api/products/update", {
          method: "PATCH",
          body: JSON.stringify({
            id: Number(product!.id),
            nombre: form.nombre,
            descripcion: form.descripcion || null,
            duracion: form.agendable_bot ? Number(form.duracion) : 0,
            agendable_bot: form.agendable_bot,
          }),
        });
      }
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
      setSaving(false);
    }
  }

  const title = mode === "create" ? `Nueva ${NIVEL_LABELS[nivel]}` : `Editar ${NIVEL_LABELS[nivel]}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between px-xl py-lg border-b border-outline-variant">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
            {parentName && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Bajo: {parentName}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form id="product-form" onSubmit={handleSubmit} className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">

          <div className="space-y-base">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block">
              Nombre <span className="text-error">*</span>
            </label>
            <input
              className={inputCls}
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              required
              maxLength={200}
              placeholder={`Nombre del ${NIVEL_LABELS[nivel].toLowerCase()}`}
            />
          </div>

          <div className="space-y-base">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block">
              Descripción
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              maxLength={500}
              placeholder="Descripción opcional"
            />
          </div>

          {form.agendable_bot && (
            <div className="space-y-base">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block">
                Duración (minutos) <span className="text-error">*</span>
              </label>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={form.duracion || ""}
                onChange={(e) => set("duracion", e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex items-start gap-md p-md rounded-lg bg-surface-container-low border border-outline-variant">
            <input
              id="agendable"
              type="checkbox"
              checked={form.agendable_bot}
              onChange={(e) => set("agendable_bot", e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-secondary flex-shrink-0"
            />
            <label htmlFor="agendable" className="flex-1 cursor-pointer">
              <p className="font-label-md text-label-md text-on-surface">Agendable por chatbot</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                El cliente puede agendar este servicio directamente desde el chatbot de WhatsApp.
              </p>
            </label>
          </div>

          {saveError && (
            <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {saveError}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-sm px-xl py-lg border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-lg py-sm rounded-lg border border-outline-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={saving}
            className="px-lg py-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-sm"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            {mode === "create" ? "Crear" : "Guardar cambios"}
          </button>
        </div>

      </div>
    </div>
  );
}

const inputCls = "w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all";