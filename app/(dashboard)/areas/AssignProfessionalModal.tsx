"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import type { ProductNode, ProfesionalAsignado } from "./ProductModal";

interface Professional {
  id: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  cargo: string;
  numero_whatsapp: string;
}

interface Props {
  product: ProductNode;
  onClose: () => void;
  onSaved: () => void;
}

function getInitials(nombres: string, apellidos: string) {
  return (nombres.charAt(0) + apellidos.charAt(0)).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container text-on-tertiary-container",
];

export default function AssignProfessionalModal({ product, onClose, onSaved }: Props) {
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [linkedIds, setLinkedIds] = useState<number[]>(
    product.profesionales?.map((p: ProfesionalAsignado) => p.profesional_id) ?? []
  );
  const [assignedList, setAssignedList] = useState<ProfesionalAsignado[]>(
    product.profesionales ?? []
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const isSingleAssignment = !product.es_agendable_por_bot;

  useEffect(() => {
    apiRequest<Professional[]>("/api/professionals/list?limit=200")
      .then((res) => setAllProfessionals(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar profesionales"))
      .finally(() => setLoading(false));
  }, []);

  const available = allProfessionals.filter((p) => {
    if (linkedIds.includes(p.id)) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      p.nombres.toLowerCase().includes(q) ||
      p.apellidos.toLowerCase().includes(q) ||
      p.cargo.toLowerCase().includes(q) ||
      p.numero_documento.toLowerCase().includes(q)
    );
  });

  async function toggle(professional: Professional) {
    const isLinked = linkedIds.includes(professional.id);
    setError(null);
    setTogglingId(professional.id);
    try {
      if (isLinked) {
        await apiRequest(`/api/professionals/${professional.id}/products/${product.id}`, { method: "DELETE" });
        setLinkedIds((prev) => prev.filter((id) => id !== professional.id));
        setAssignedList((prev) => prev.filter((p) => p.profesional_id !== professional.id));
      } else {
        await apiRequest(`/api/professionals/${professional.id}/products/${product.id}`, { method: "POST" });
        setLinkedIds((prev) => [...prev, professional.id]);
        setAssignedList((prev) => [...prev, {
          profesional_id: professional.id,
          nombres: professional.nombres,
          apellidos: professional.apellidos,
          cargo: professional.cargo,
          numero_whatsapp: professional.numero_whatsapp,
        }]);
      }
      setHasChanges(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar asignación");
    } finally {
      setTogglingId(null);
    }
  }

  function handleClose() {
    hasChanges ? onSaved() : onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between px-xl py-lg border-b border-outline-variant">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Asignar profesionales</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{product.nombre}</p>
          </div>
          <button onClick={handleClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {isSingleAssignment && (
          <div className="mx-xl mt-lg flex items-start gap-sm p-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0">info</span>
            Servicio no agendable por chatbot — solo admite un profesional. Las notificaciones con los datos del cliente/paciente se realizarán por ese medio.
          </div>
        )}

        <div className="overflow-y-auto flex-1 custom-scrollbar">

          {/* Sección: Asignados */}
          <div className="px-xl pt-lg pb-md">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">
              Asignados ({assignedList.length})
            </p>

            {assignedList.length === 0 ? (
              <div className="py-md px-md border border-dashed border-outline-variant rounded-lg text-center text-on-surface-variant font-body-sm text-body-sm">
                Ningún profesional asignado aún.
              </div>
            ) : (
              <div className="space-y-sm">
                {assignedList.map((p, idx) => {
                  const pro: Professional = {
                    id: p.profesional_id,
                    nombres: p.nombres,
                    apellidos: p.apellidos,
                    tipo_documento: "",
                    numero_documento: "",
                    cargo: p.cargo,
                    numero_whatsapp: p.numero_whatsapp,
                  };
                  return (
                    <ProfessionalRow
                      key={p.profesional_id}
                      professional={pro}
                      idx={idx}
                      isLinked={true}
                      toggling={togglingId === p.profesional_id}
                      blocked={false}
                      onToggle={() => toggle(pro)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="mx-xl border-t border-outline-variant" />

          {/* Sección: Disponibles */}
          <div className="px-xl pt-md pb-lg">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">
              Disponibles
            </p>

            <div className="relative mb-sm">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full pl-xl pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
                placeholder="Buscar por nombre, cargo o documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md mb-sm">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {loading ? null : available.length === 0 ? (
              <div className="py-md text-center text-on-surface-variant font-body-sm text-body-sm">
                {search ? "No se encontraron profesionales." : "Todos los profesionales están asignados."}
              </div>
            ) : (
              <div className="space-y-sm">
                {available.map((pro, idx) => {
                  const blocked = isSingleAssignment && assignedList.length > 0;
                  return (
                    <ProfessionalRow
                      key={pro.id}
                      professional={pro}
                      idx={idx}
                      isLinked={false}
                      toggling={togglingId === pro.id}
                      blocked={blocked}
                      onToggle={() => toggle(pro)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-xl py-lg border-t border-outline-variant">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {assignedList.length} profesional{assignedList.length !== 1 ? "es" : ""} asignado{assignedList.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={handleClose}
            className="px-lg py-sm rounded-lg border border-outline-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

interface RowProps {
  professional: Professional;
  idx: number;
  isLinked: boolean;
  toggling: boolean;
  blocked: boolean;
  onToggle: () => void;
}

function ProfessionalRow({ professional, idx, isLinked, toggling, blocked, onToggle }: RowProps) {
  return (
    <div className={`flex items-center justify-between p-md rounded-lg border transition-colors ${
      isLinked ? "border-secondary/40 bg-secondary-container/20" : "border-outline-variant bg-surface-container-lowest"
    }`}>
      <div className="flex items-center gap-md flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
          {getInitials(professional.nombres, professional.apellidos)}
        </div>
        <div className="min-w-0">
          <p className="font-body-md text-body-md text-on-surface font-semibold">
            {professional.nombres} {professional.apellidos}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {professional.cargo} · {professional.tipo_documento} {professional.numero_documento}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={toggling || blocked}
        title={blocked ? "Este servicio solo admite un profesional asignado" : undefined}
        className={`ml-md flex items-center gap-xs px-md py-xs rounded-lg font-label-md text-label-md transition-all active:scale-95 disabled:opacity-40 ${
          isLinked
            ? "bg-secondary text-on-secondary hover:opacity-80"
            : blocked
            ? "border border-outline-variant text-on-surface-variant cursor-not-allowed"
            : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
        }`}
      >
        {toggling ? (
          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-[16px]">{isLinked ? "link_off" : "add_link"}</span>
        )}
        {isLinked ? "Desvincular" : "Vincular"}
      </button>
    </div>
  );
}