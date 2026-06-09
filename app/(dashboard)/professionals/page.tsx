"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest, type Pagination } from "@/lib/api";
import CreateProfessionalModal from "./CreateProfessionalModal";
import ProfessionalDetailModal from "./ProfessionalDetailModal";

interface Professional {
  id: number;
  professional_id: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  email: string;
  cellphone_number: string;
  cargo: string;
  numero_whatsapp: string;
}

const AVATAR_COLORS = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-primary-fixed text-on-primary-fixed",
  "bg-secondary-fixed text-on-secondary-fixed",
];

function getInitials(nombres: string, apellidos: string) {
  return (nombres.charAt(0) + apellidos.charAt(0)).toUpperCase();
}

const PAGE_SIZE = 10;

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0, page: 1, limit: PAGE_SIZE, total_pages: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Professional | null>(null);

  const fetchProfessionals = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (searchTerm) params.set("search", searchTerm);
      const res = await apiRequest<Professional[]>(`/api/professionals/list?${params}`);
      setProfessionals(res.data);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar profesionales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProfessionals(1, search), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, fetchProfessionals]);

  function handlePageChange(page: number) {
    if (page < 1 || page > pagination.total_pages) return;
    fetchProfessionals(page, search);
  }

  function getPageButtons() {
    const { page, total_pages } = pagination;
    if (total_pages <= 5) return Array.from({ length: total_pages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (let p = Math.max(2, page - 1); p <= Math.min(total_pages - 1, page + 1); p++) pages.push(p);
    if (page < total_pages - 2) pages.push("...");
    pages.push(total_pages);
    return pages;
  }

  return (
    <>
    <div className="flex-1 overflow-y-auto p-xl space-y-xl bg-background custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="space-y-base">
          <div className="flex items-center gap-xs text-on-surface-variant">
            <span className="font-label-md text-[11px] uppercase tracking-tighter">Orientando</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-label-md text-[11px] uppercase tracking-tighter">Administración</span>
          </div>
          <h2 className="font-display-lg text-display-lg text-primary">Gestión de Profesionales</h2>
          <p className="text-on-surface-variant font-body-md text-body-md max-w-2xl">
            Consulte y administre los profesionales registrados en el sistema.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={() => fetchProfessionals(pagination.page, search)}
            className="flex items-center gap-sm px-md py-sm border border-outline-variant rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">refresh</span>
            Actualizar
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-sm px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">person_add</span>
            Nuevo Profesional
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-xl flex flex-wrap items-center gap-md">
        <div className="flex-1 min-w-[280px]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full pl-xl pr-md py-sm bg-background border border-outline-variant rounded-lg focus:ring-1 focus:ring-secondary focus:border-secondary text-body-md font-body-md outline-none transition-all"
              placeholder="Buscar por nombre, cargo, correo o documento..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {search && (
          <button
            className="p-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
            title="Limpiar búsqueda"
            onClick={() => setSearch("")}
          >
            <span className="material-symbols-outlined">filter_alt_off</span>
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {["Nombre", "Documento", "Cargo", "Correo Electrónico", "WhatsApp", "Acciones"].map((h, i) => (
                  <th key={h} className={`px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider ${i === 5 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant font-body-md text-body-md">
                    <div className="flex items-center justify-center gap-sm">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Cargando profesionales...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-lg py-xl text-center">
                    <div className="flex flex-col items-center gap-sm text-error">
                      <span className="material-symbols-outlined text-[32px]">error</span>
                      <span className="font-body-md text-body-md">{error}</span>
                      <button
                        onClick={() => fetchProfessionals(pagination.page, search)}
                        className="mt-sm px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
                      >
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : professionals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant font-body-md text-body-md">
                    No se encontraron profesionales.
                  </td>
                </tr>
              ) : (
                professionals.map((pro, idx) => (
                  <tr
                    key={pro.id}
                    className={`hover:bg-surface-container-low/50 transition-colors ${idx % 2 === 1 ? "bg-surface-container-low/20" : ""}`}
                  >
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                          {getInitials(pro.nombres, pro.apellidos)}
                        </div>
                        <span className="font-body-md text-body-md text-on-surface font-semibold">
                          {pro.nombres} {pro.apellidos}
                        </span>
                      </div>
                    </td>
                    <td className="px-lg py-md font-data-mono text-data-mono text-on-surface-variant">
                      {pro.tipo_documento} {pro.numero_documento}
                    </td>
                    <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">
                      {pro.cargo}
                    </td>
                    <td className="px-lg py-md font-data-mono text-data-mono text-on-surface-variant">
                      {pro.email}
                    </td>
                    <td className="px-lg py-md font-data-mono text-data-mono text-on-surface-variant">
                      {pro.numero_whatsapp}
                    </td>
                    <td className="px-lg py-md text-right">
                      <button
                        onClick={() => setSelected(pro)}
                        className="p-xs text-secondary hover:bg-secondary-container/20 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && !error && pagination.total > 0 && (
          <div className="bg-surface-container-low px-lg py-md flex items-center justify-between border-t border-outline-variant">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Mostrando{" "}
              <span className="font-bold text-on-surface">
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              de <span className="font-bold text-on-surface">{pagination.total}</span> profesionales
            </p>
            <div className="flex items-center gap-base">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              {getPageButtons().map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="mx-xs text-on-surface-variant">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded font-label-md text-label-md transition-colors ${pagination.page === p ? "bg-secondary text-on-secondary" : "hover:bg-surface-container-high"}`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                disabled={pagination.page === pagination.total_pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {createOpen && (
      <CreateProfessionalModal
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); fetchProfessionals(1, search); }}
      />
    )}

    {selected && (
      <ProfessionalDetailModal
        professional={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => { setSelected(null); fetchProfessionals(pagination.page, search); }}
      />
    )}
    </>
  );
}