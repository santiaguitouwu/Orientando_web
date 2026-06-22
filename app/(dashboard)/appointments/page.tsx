"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import AppointmentFormModal from "./AppointmentFormModal";
import AppointmentDetailModal from "./AppointmentDetailModal";

export interface AppointmentRow {
  cita_id: number;
  cliente_id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  cliente_nombres: string;
  cliente_apellidos: string;
  cliente_numero_documento: string;
  producto_nombre: string;
  profesional_id: number;
  profesional_nombres: string;
  estado_cita_id: number;
  estado_cita: string;
  google_calendar_event_id: string;
}

function todayStr() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function getInitials(names: string, lastNames: string) {
  return (names.charAt(0) + (lastNames?.charAt(0) ?? "")).toUpperCase();
}

const STATE_COLORS: Record<string, string> = {
  AGENDADO: "bg-primary-container text-on-primary-container",
  FINALIZADO: "bg-tertiary-container text-on-tertiary-container",
  CANCELADO: "bg-error-container text-on-error-container",
  "NO ASISTIO": "bg-error-container text-on-error-container",
};

function stateChip(state: string) {
  const cls = STATE_COLORS[state] ?? "bg-surface-container-high text-on-surface";
  return (
    <span className={`inline-block px-sm py-xs rounded-full font-label-md text-[11px] uppercase tracking-wide ${cls}`}>
      {state}
    </span>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AppointmentRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAppointments = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ start_date: start, end_date: end });
      const res = await apiRequest<AppointmentRow[]>(`/api/appointments/get-by-date?${params}`);
      setAppointments(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar citas");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(startDate, endDate);
  }, []);

  async function handleDelete(row: AppointmentRow) {
    if (!confirm(`¿Eliminar la cita de ${row.cliente_nombres} ${row.cliente_apellidos}? Esta acción también eliminará el evento de Google Calendar.`)) return;
    setDeletingId(row.cita_id);
    try {
      await apiRequest("/api/appointments", {
        method: "DELETE",
        body: JSON.stringify({ appointment_id: String(row.cita_id) }),
      });
      fetchAppointments(startDate, endDate);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar cita");
    } finally {
      setDeletingId(null);
    }
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
            <h2 className="font-display-lg text-display-lg text-primary">Gestión de Citas</h2>
            <p className="text-on-surface-variant font-body-md text-body-md max-w-2xl">
              Administre las citas sincronizadas con Google Calendar.
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => fetchAppointments(startDate, endDate)}
              className="flex items-center gap-sm px-md py-sm border border-outline-variant rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">refresh</span>
              Actualizar
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-sm px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">add</span>
              Nueva Cita
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-xl flex flex-wrap items-end gap-md">
          <div className="space-y-base">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block text-[11px]">
              Fecha inicio
            </label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              maxLength={10}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-sm py-xs bg-background border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all w-36"
            />
          </div>
          <div className="space-y-base">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block text-[11px]">
              Fecha fin
            </label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              maxLength={10}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-sm py-xs bg-background border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all w-36"
            />
          </div>
          <button
            onClick={() => fetchAppointments(startDate, endDate)}
            className="flex items-center gap-sm px-md py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">search</span>
            Buscar
          </button>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {["Cliente", "Servicio", "Profesional", "Inicio", "Fin", "Estado", "Acciones"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider ${i === 6 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-lg py-xl text-center text-on-surface-variant font-body-md text-body-md">
                      <div className="flex items-center justify-center gap-sm">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Cargando citas...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-lg py-xl text-center">
                      <div className="flex flex-col items-center gap-sm text-error">
                        <span className="material-symbols-outlined text-[32px]">error</span>
                        <span className="font-body-md text-body-md">{error}</span>
                        <button
                          onClick={() => fetchAppointments(startDate, endDate)}
                          className="mt-sm px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
                        >
                          Reintentar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-lg py-xl text-center text-on-surface-variant font-body-md text-body-md">
                      No se encontraron citas para el rango seleccionado.
                    </td>
                  </tr>
                ) : (
                  appointments.map((row, idx) => (
                    <tr
                      key={row.cita_id}
                      className={`hover:bg-surface-container-low/50 transition-colors ${idx % 2 === 1 ? "bg-surface-container-low/20" : ""}`}
                    >
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-sm">
                          <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                            {getInitials(row.cliente_nombres, row.cliente_apellidos)}
                          </div>
                          <div>
                            <p className="font-body-md text-body-md text-on-surface font-semibold">
                              {row.cliente_nombres} {row.cliente_apellidos}
                            </p>
                            <p className="font-data-mono text-[11px] text-on-surface-variant">{row.cliente_numero_documento}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-md font-body-md text-body-md text-on-surface">{row.producto_nombre}</td>
                      <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">{row.profesional_nombres}</td>
                      <td className="px-lg py-md font-data-mono text-data-mono text-on-surface-variant whitespace-nowrap">
                        {new Date(row.fecha_hora_inicio).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-lg py-md font-data-mono text-data-mono text-on-surface-variant whitespace-nowrap">
                        {new Date(row.fecha_hora_fin).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-lg py-md">{stateChip(row.estado_cita)}</td>
                      <td className="px-lg py-md text-right">
                        <div className="flex items-center justify-end gap-xs">
                          <button
                            onClick={() => setDetailTarget(row.cita_id)}
                            className="p-xs text-secondary hover:bg-secondary-container/20 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button
                            onClick={() => setEditTarget(row)}
                            className="p-xs text-primary hover:bg-primary-container/20 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.cita_id}
                            className="p-xs text-error hover:bg-error-container/20 rounded-lg transition-colors disabled:opacity-40"
                            title="Eliminar"
                          >
                            {deletingId === row.cita_id
                              ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                              : <span className="material-symbols-outlined">delete</span>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && !error && appointments.length > 0 && (
            <div className="bg-surface-container-low px-lg py-md border-t border-outline-variant">
              <p className="font-body-md text-body-md text-on-surface-variant">
                <span className="font-bold text-on-surface">{appointments.length}</span> cita{appointments.length !== 1 ? "s" : ""} encontrada{appointments.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <AppointmentFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); fetchAppointments(startDate, endDate); }}
        />
      )}

      {editTarget && (
        <AppointmentFormModal
          editRow={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchAppointments(startDate, endDate); }}
        />
      )}

      {detailTarget !== null && (
        <AppointmentDetailModal
          appointmentId={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </>
  );
}