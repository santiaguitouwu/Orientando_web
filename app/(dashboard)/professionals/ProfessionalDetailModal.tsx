"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

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

interface Appointment {
  appointment_id: number;
  start_date_time: string;
  product_name: string;
  client_names: string;
  client_last_names: string;
  appointment_status: string;
}

interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  es_agendable_por_bot: boolean;
}

interface Props {
  professional: Professional;
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

export default function ProfessionalDetailModal({ professional, onClose, onUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<"datos" | "citas" | "servicios">("datos");
  const [form, setForm] = useState({
    names: professional.nombres,
    last_names: professional.apellidos,
    document_type: professional.tipo_documento,
    document_number: professional.numero_documento,
    email: professional.email,
    cellphone_number: professional.cellphone_number,
    cargo: professional.cargo,
    whatsapp_number: professional.numero_whatsapp,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [apptsError, setApptsError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [linkedIds, setLinkedIds] = useState<number[]>([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [prodsError, setProdsError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    if (activeTab !== "citas") return;
    setLoadingAppts(true);
    setApptsError(null);
    apiRequest<Appointment[]>(`/api/professionals/${professional.professional_id}/appointments`)
      .then((res) => setAppointments(res.data))
      .catch((err) => setApptsError(err instanceof Error ? err.message : "Error al cargar citas"))
      .finally(() => setLoadingAppts(false));
  }, [activeTab, professional.professional_id]);

  useEffect(() => {
    if (activeTab !== "servicios") return;
    setLoadingProds(true);
    setProdsError(null);
    Promise.all([
      apiRequest<Product[]>(`/api/professionals/${professional.id}/linkable-products`),
      apiRequest<number[]>(`/api/professionals/${professional.id}/products`),
    ])
      .then(([prodsRes, linkedRes]) => {
        setAllProducts(prodsRes.data);
        setLinkedIds(linkedRes.data);
      })
      .catch((err) => setProdsError(err instanceof Error ? err.message : "Error al cargar servicios"))
      .finally(() => setLoadingProds(false));
  }, [activeTab, professional.id]);

  async function toggleProduct(productId: number) {
    const isLinked = linkedIds.includes(productId);
    setTogglingId(productId);
    try {
      if (isLinked) {
        await apiRequest(`/api/professionals/${professional.id}/products/${productId}`, { method: "DELETE" });
      } else {
        await apiRequest(`/api/professionals/${professional.id}/products/${productId}`, { method: "POST" });
      }
      const [prodsRes, linkedRes] = await Promise.all([
        apiRequest<Product[]>(`/api/professionals/${professional.id}/linkable-products`),
        apiRequest<number[]>(`/api/professionals/${professional.id}/products`),
      ]);
      setAllProducts(prodsRes.data);
      setLinkedIds(linkedRes.data);
    } catch (err) {
      setProdsError(err instanceof Error ? err.message : "Error al actualizar enlace");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      await apiRequest("/api/professionals/update", {
        method: "PATCH",
        body: JSON.stringify({ ...form, id: String(professional.id) }),
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
              {professional.nombres} {professional.apellidos}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {professional.cargo} · {professional.tipo_documento} {professional.numero_documento}
            </p>
          </div>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant px-xl">
          {(["datos", "citas", "servicios"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-md py-sm font-label-md text-label-md uppercase tracking-wider border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-secondary text-secondary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab === "datos" ? "Datos del profesional" : tab === "citas" ? "Historial de citas" : "Servicios"}
            </button>
          ))}
        </div>

        {/* Tab: Datos */}
        {activeTab === "datos" && (
          <>
            <form id="edit-pro-form" onSubmit={handleSave} className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">
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
                  <input className={inputCls} value={form.cargo} onChange={(e) => set("cargo", e.target.value)} required maxLength={100} />
                </Field>
                <Field label="WhatsApp" required>
                  <input className={inputCls} value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} required maxLength={15} />
                </Field>
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
                form="edit-pro-form"
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
                Este profesional no tiene citas registradas.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    {["Fecha", "Cliente", "Servicio", "Estado"].map((h) => (
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
                        {appt.client_names} {appt.client_last_names}
                      </td>
                      <td className="py-sm pr-lg font-body-md text-body-md text-on-surface-variant">
                        {appt.product_name}
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
        {/* Tab: Servicios */}
        {activeTab === "servicios" && (
          <div className="overflow-y-auto px-xl py-lg custom-scrollbar flex-1">
            {loadingProds ? (
              <div className="flex items-center justify-center gap-sm py-xl text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Cargando servicios...
              </div>
            ) : prodsError ? (
              <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {prodsError}
              </div>
            ) : allProducts.length === 0 ? (
              <div className="text-center py-xl text-on-surface-variant font-body-md text-body-md">
                No hay servicios registrados en el sistema.
              </div>
            ) : (
              <div className="space-y-sm">
                {allProducts.map((product) => {
                  const linked = linkedIds.includes(product.id);
                  const toggling = togglingId === product.id;
                  return (
                    <div
                      key={product.id}
                      className={`flex items-start justify-between p-md rounded-lg border transition-colors ${
                        linked
                          ? "border-secondary/40 bg-secondary-container/20"
                          : "border-outline-variant bg-surface-container-lowest"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm flex-wrap">
                          <p className="font-body-md text-body-md text-on-surface font-semibold">
                            {product.nombre}
                          </p>
                          {!product.es_agendable_por_bot && (
                            <span className="inline-flex items-center gap-xs px-xs py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                              <span className="material-symbols-outlined text-[12px]">smartphone</span>
                              No agendable por chatbot
                            </span>
                          )}
                        </div>
                        {product.descripcion && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            {product.descripcion}
                          </p>
                        )}
                        {product.duracion > 0 && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                            {product.duracion} min
                          </p>
                        )}
                        {!product.es_agendable_por_bot && (
                          <p className="font-body-sm text-body-sm text-amber-700 mt-sm flex items-start gap-xs">
                            <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0">info</span>
                            Verifique que los números de contacto del profesional estén correctamente configurados, ya que las notificaciones con los datos de los clientes/pacientes se realizarán por ese medio.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleProduct(product.id)}
                        disabled={toggling}
                        className={`ml-md flex items-center gap-xs px-md py-xs rounded-lg font-label-md text-label-md transition-all active:scale-95 disabled:opacity-50 ${
                          linked
                            ? "bg-secondary text-on-secondary hover:opacity-80"
                            : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {toggling ? (
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">
                            {linked ? "link_off" : "add_link"}
                          </span>
                        )}
                        {linked ? "Desvincular" : "Vincular"}
                      </button>
                    </div>
                  );
                })}
              </div>
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