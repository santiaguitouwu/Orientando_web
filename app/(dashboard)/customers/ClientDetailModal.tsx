"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

interface Client {
  id: number;
  client_id: number;
  names: string;
  last_names: string;
  document_type: string;
  document_number: string;
  email: string;
  cellphone_number: string;
  guardian_name: string;
  age: string;
  neighborhood: string;
  address: string;
  sent_by_institution: boolean;
  institution: string;
}

interface Appointment {
  appointment_id: number;
  start_date_time: string;
  end_date_time: string;
  product_name: string;
  professional_names: string;
  professional_last_names: string;
  appointment_status: string;
  observations: string;
}

interface Props {
  client: Client;
  onClose: () => void;
  onUpdated: () => void;
}

const DOCUMENT_TYPES = ["CC", "TI", "CE", "PP", "RC"];

const STATUS_COLORS: Record<string, string> = {
  AGENDADO: "bg-blue-100 text-blue-700",
  COMPLETADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-100 text-red-700",
  "NO ASISTIO": "bg-orange-100 text-orange-700",
  "NO ASISTIÓ": "bg-orange-100 text-orange-700",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ClientDetailModal({ client, onClose, onUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<"datos" | "citas">("datos");
  const [form, setForm] = useState({
    ...client,
    age: String(client.age),
    guardian_name: client.guardian_name ?? "",
    institution: client.institution ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [apptsError, setApptsError] = useState<string | null>(null);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    if (activeTab !== "citas") return;
    setLoadingAppts(true);
    setApptsError(null);
    apiRequest<Appointment[]>(`/api/clients/${client.client_id}/appointments`)
      .then((res) => setAppointments(res.data))
      .catch((err) => setApptsError(err instanceof Error ? err.message : "Error al cargar citas"))
      .finally(() => setLoadingAppts(false));
  }, [activeTab, client.client_id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const payload = {
        id: String(client.id),
        names: form.names,
        last_names: form.last_names,
        document_type: form.document_type,
        document_number: form.document_number,
        email: form.email,
        cellphone_number: form.cellphone_number,
        age: form.age,
        neighborhood: form.neighborhood,
        address: form.address,
        guardian_name: form.guardian_name,
        institution: form.institution,
        sent_by_institution: form.sent_by_institution,
      };
      await apiRequest("/api/clients/update-client", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onUpdated();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between px-xl py-lg border-b border-outline-variant">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {client.names} {client.last_names}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {client.document_type} {client.document_number}
            </p>
          </div>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant px-xl">
          {(["datos", "citas"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-md py-sm font-label-md text-label-md uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-secondary text-secondary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab === "datos" ? "Datos del cliente" : "Historial de citas"}
            </button>
          ))}
        </div>

        {/* Tab: Datos */}
        {activeTab === "datos" && (
          <>
            <form id="edit-form" onSubmit={handleSave} className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">
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
                <Field label="Edad" required>
                  <input className={inputCls} value={form.age} onChange={(e) => set("age", e.target.value)} required pattern="\d{1,3}" maxLength={3} />
                </Field>
                <Field label="Barrio" required>
                  <input className={inputCls} value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} required maxLength={100} />
                </Field>
              </div>

              <Field label="Dirección" required>
                <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} required maxLength={100} />
              </Field>

              <Field label="Nombre del acudiente">
                <input className={inputCls} value={form.guardian_name ?? ""} onChange={(e) => set("guardian_name", e.target.value)} maxLength={200} />
              </Field>

              <label className="flex items-center gap-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-secondary"
                  checked={form.sent_by_institution}
                  onChange={(e) => set("sent_by_institution", e.target.checked)}
                />
                <span className="font-body-md text-body-md text-on-surface">Remitido por institución educativa</span>
              </label>

              {form.sent_by_institution && (
                <Field label="Institución educativa">
                  <input className={inputCls} value={form.institution ?? ""} onChange={(e) => set("institution", e.target.value)} maxLength={200} />
                </Field>
              )}

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
                form="edit-form"
                disabled={saving}
                className="px-lg py-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-sm"
              >
                {saving && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                Guardar cambios
              </button>
            </div>
          </>
        )}

        {/* Tab: Citas */}
        {activeTab === "citas" && (
          <div className="overflow-y-auto px-xl py-lg custom-scrollbar flex-1">
            {loadingAppts ? (
              <div className="flex items-center justify-center gap-sm py-xl text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Cargando citas...
              </div>
            ) : apptsError ? (
              <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {apptsError}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-xl text-on-surface-variant font-body-md text-body-md">
                Este cliente no tiene citas registradas.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    {["Fecha", "Servicio", "Profesional", "Estado"].map((h) => (
                      <th key={h} className="pb-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider pr-lg">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {appointments.map((appt) => (
                    <tr key={appt.appointment_id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-sm pr-lg font-data-mono text-data-mono text-on-surface-variant whitespace-nowrap">
                        {formatDate(appt.start_date_time)}
                      </td>
                      <td className="py-sm pr-lg font-body-md text-body-md text-on-surface">
                        {appt.product_name}
                      </td>
                      <td className="py-sm pr-lg font-body-md text-body-md text-on-surface-variant">
                        {appt.professional_names} {appt.professional_last_names}
                      </td>
                      <td className="py-sm">
                        <span className={`inline-flex items-center px-sm py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_COLORS[appt.appointment_status] ?? "bg-slate-100 text-slate-600"}`}>
                          {appt.appointment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
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