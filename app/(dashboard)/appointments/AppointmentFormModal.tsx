"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import DateTimePicker from "@/components/DateTimePicker";
import type { AppointmentRow } from "./page";

interface Props {
  editRow?: AppointmentRow;
  onClose: () => void;
  onSaved: () => void;
}

interface Client {
  id: number;           // usuarios.id — what fn_insert_appointment expects
  client_id: number;    // clientes.id
  names: string;
  last_names: string;
  document_number: string;
}

interface Professional {
  id: number;               // usuarios.id — what fn_insert_appointment expects
  professional_id: number;  // profesionales.id
  nombres: string;
  apellidos: string;
  cargo: string;
}

interface Product {
  id: number;
  nombre: string;
  duracion: number;
}

interface AppointmentState {
  id: number;
  nombre: string;
}

interface AppointmentDetail {
  id: number;
  start_date_time: string;
  end_date_time: string;
  observations: string;
  client: { id: number; names: string; last_names: string; document_number: string };
  product: { id: number; name: string };
  assigned_professional: { id: number };
  current_state: { code: string };
}

const inputCls = "w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-base">
      <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block text-[11px]">
        {label}{required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AppointmentFormModal({ editRow, onClose, onSaved }: Props) {
  const isEdit = !!editRow;

  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [states, setStates] = useState<AppointmentState[]>([]);

  const [form, setForm] = useState({
    professional_id: "",
    product_id: "",
    start_date_time: "",
    end_date_time: "",
    current_state_id: "1",
    observations: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function isoToInputDate(isoStr: string) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  useEffect(() => {
    async function loadDropdowns() {
      const safeLoad = async <T,>(path: string): Promise<T[]> => {
        try {
          const res = await apiRequest<T[]>(path);
          return res.data ?? [];
        } catch {
          return [];
        }
      };

      const [profs, prods, sts] = await Promise.all([
        safeLoad<Professional>("/api/professionals/list?page=1&limit=200&search="),
        safeLoad<Product>("/api/products?leaf=true"),
        safeLoad<AppointmentState>("/api/appointments/states"),
      ]);
      setProfessionals(profs);
      setProducts(prods);
      setStates(sts);
    }

    async function loadEditDetail() {
      if (!isEdit || !editRow) return;
      try {
        const res = await apiRequest<AppointmentDetail>(`/api/appointments?id=${editRow.cita_id}`);
        const d = res.data;
        setSelectedClient({
          id: d.client.id,
          client_id: d.client.id,
          names: d.client.names,
          last_names: d.client.last_names,
          document_number: d.client.document_number,
        });
        setForm({
          professional_id: String(d.assigned_professional.id),
          product_id: String(d.product.id),
          start_date_time: isoToInputDate(d.start_date_time),
          end_date_time: isoToInputDate(d.end_date_time),
          current_state_id: String(d.current_state.code),
          observations: d.observations ?? "",
        });
      } catch {
        // leave form empty on error
      }
    }

    setLoadingData(true);
    Promise.all([loadDropdowns(), loadEditDetail()]).finally(() => setLoadingData(false));
  }, [isEdit, editRow]);

  useEffect(() => {
    if (!clientSearch.trim()) { setClientResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: "10", page: "1", search: clientSearch });
        const res = await apiRequest<Client[]>(`/api/clients?${params}`);
        setClientResults(res.data ?? []);
      } catch { setClientResults([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) { setError("Debe seleccionar un cliente."); return; }
    if (!form.product_id) { setError("Debe seleccionar un servicio."); return; }
    if (!form.professional_id) { setError("Debe seleccionar un profesional."); return; }
    if (!form.start_date_time) { setError("Debe seleccionar la fecha y hora de inicio."); return; }
    if (!form.end_date_time) { setError("Debe seleccionar la fecha y hora de fin."); return; }
    setError(null);
    setLoading(true);
    try {
      if (isEdit && editRow) {
        await apiRequest("/api/appointments/update-appointment", {
          method: "PUT",
          body: JSON.stringify({
            appointment_id: String(editRow.cita_id),
            client_id: String(selectedClient.id),
            product_id: form.product_id,
            professional_id: form.professional_id,
            start_date_time: form.start_date_time,
            end_date_time: form.end_date_time,
            current_state_id: form.current_state_id,
            observations: form.observations,
          }),
        });
      } else {
        await apiRequest("/api/appointments", {
          method: "POST",
          body: JSON.stringify({
            client_id: String(selectedClient.id),
            product_id: form.product_id,
            professional_id: form.professional_id,
            start_date_time: form.start_date_time,
            end_date_time: form.end_date_time,
            current_state_id: form.current_state_id,
            observations: form.observations,
          }),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar cita");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-xl py-lg border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            {isEdit ? "Editar Cita" : "Nueva Cita"}
          </h3>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <form id="appointment-form" onSubmit={handleSubmit} className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">
          {loadingData && (
            <div className="flex items-center gap-sm text-on-surface-variant font-body-md text-body-md">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Cargando datos...
            </div>
          )}

          {/* Client search */}
          <Field label="Cliente" required>
            {selectedClient ? (
              <div className="flex items-center justify-between px-sm py-xs bg-secondary-container/20 border border-secondary rounded-lg">
                <span className="font-body-md text-body-md text-on-surface">
                  {selectedClient.names} {selectedClient.last_names} — {selectedClient.document_number}
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedClient(null); setClientSearch(""); }}
                  className="p-xs rounded hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  className={inputCls}
                  placeholder="Buscar por nombre o documento..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                {clientResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {clientResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-sm py-xs hover:bg-surface-container-low transition-colors font-body-md text-body-md text-on-surface"
                        onClick={() => { setSelectedClient(c); setClientSearch(""); setClientResults([]); }}
                      >
                        {c.names} {c.last_names} — {c.document_number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Field>

          {/* Professional + Product */}
          <div className="grid grid-cols-2 gap-md">
            <Field label="Profesional" required>
              <select
                className={inputCls}
                value={form.professional_id}
                onChange={(e) => set("professional_id", e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} {p.apellidos}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Servicio" required>
              <select
                className={inputCls}
                value={form.product_id}
                onChange={(e) => set("product_id", e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.duracion} min)
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-md">
            <Field label="Fecha y hora inicio" required>
              <DateTimePicker
                value={form.start_date_time}
                onChange={(v) => set("start_date_time", v)}
                placeholder="DD/MM/YYYY HH:mm"
              />
            </Field>
            <Field label="Fecha y hora fin" required>
              <DateTimePicker
                value={form.end_date_time}
                onChange={(v) => set("end_date_time", v)}
                placeholder="DD/MM/YYYY HH:mm"
              />
            </Field>
          </div>

          {/* State — solo visible al editar; en creación siempre queda AGENDADO */}
          {isEdit && (
            <Field label="Estado" required>
              <select
                className={inputCls}
                value={form.current_state_id}
                onChange={(e) => set("current_state_id", e.target.value)}
                required
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Observations */}
          <Field label="Observaciones" required>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              maxLength={500}
              value={form.observations}
              onChange={(e) => set("observations", e.target.value)}
              required
              placeholder="Escriba las observaciones de la cita..."
            />
          </Field>

          {error && (
            <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
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
            form="appointment-form"
            disabled={loading || loadingData}
            className="px-lg py-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-sm"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            {isEdit ? "Guardar cambios" : "Crear Cita"}
          </button>
        </div>
      </div>
    </div>
  );
}