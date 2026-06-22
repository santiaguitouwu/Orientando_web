"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

interface Props {
  appointmentId: number;
  onClose: () => void;
}

interface AppointmentDetail {
  id: number;
  start_date_time: string;
  end_date_time: string;
  observations: string;
  google_calendar_event_id: string;
  google_calendar_event_url: string;
  client: {
    id: number;
    names: string;
    last_names: string;
    document_type: string;
    document_number: string;
    email: string;
    cellphone: string;
  };
  product: {
    id: number;
    name: string;
    description: string;
    duration: number;
  };
  assigned_professional: {
    id: number;
    names: string;
    last_names: string;
    email: string;
    occupation: string;
    whatsapp_number: string;
  };
  current_state: {
    code: string;
    description: string;
    register_date: string;
  };
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-base">
      <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</span>
      <span className="font-body-md text-body-md text-on-surface">{value ?? "—"}</span>
    </div>
  );
}

export default function AppointmentDetailModal({ appointmentId, onClose }: Props) {
  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest<AppointmentDetail>(`/api/appointments?id=${appointmentId}`);
        setDetail(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar detalle");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [appointmentId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-xl py-lg border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Detalle de Cita</h3>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center py-xl gap-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Cargando...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          {detail && (
            <>
              {/* State badge */}
              <div className="flex items-center gap-sm">
                <span className="inline-block px-md py-xs rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md uppercase tracking-wide">
                  {detail.current_state.description}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant">
                  desde {detail.current_state.register_date}
                </span>
              </div>

              {/* Schedule */}
              <section>
                <h4 className="font-title-sm text-title-sm text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  Horario
                </h4>
                <div className="grid grid-cols-2 gap-md bg-surface-container-lowest p-md rounded-xl border border-outline-variant">
                  <Row label="Inicio" value={detail.start_date_time} />
                  <Row label="Fin" value={detail.end_date_time} />
                </div>
              </section>

              {/* Client */}
              <section>
                <h4 className="font-title-sm text-title-sm text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  Cliente
                </h4>
                <div className="grid grid-cols-2 gap-md bg-surface-container-lowest p-md rounded-xl border border-outline-variant">
                  <Row label="Nombre" value={`${detail.client.names} ${detail.client.last_names}`} />
                  <Row label="Documento" value={`${detail.client.document_type} ${detail.client.document_number}`} />
                  <Row label="Email" value={detail.client.email} />
                  <Row label="Teléfono" value={detail.client.cellphone} />
                </div>
              </section>

              {/* Professional */}
              <section>
                <h4 className="font-title-sm text-title-sm text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">engineering</span>
                  Profesional
                </h4>
                <div className="grid grid-cols-2 gap-md bg-surface-container-lowest p-md rounded-xl border border-outline-variant">
                  <Row label="Nombre" value={`${detail.assigned_professional.names} ${detail.assigned_professional.last_names}`} />
                  <Row label="Cargo" value={detail.assigned_professional.occupation} />
                  <Row label="Email" value={detail.assigned_professional.email} />
                  <Row label="WhatsApp" value={detail.assigned_professional.whatsapp_number} />
                </div>
              </section>

              {/* Product */}
              <section>
                <h4 className="font-title-sm text-title-sm text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">medical_services</span>
                  Servicio
                </h4>
                <div className="grid grid-cols-2 gap-md bg-surface-container-lowest p-md rounded-xl border border-outline-variant">
                  <Row label="Nombre" value={detail.product.name} />
                  <Row label="Duración" value={detail.product.duration ? `${detail.product.duration} min` : undefined} />
                  <div className="col-span-2">
                    <Row label="Descripción" value={detail.product.description} />
                  </div>
                </div>
              </section>

              {/* GCal link */}
              {detail.google_calendar_event_url && (
                <section>
                  <h4 className="font-title-sm text-title-sm text-primary mb-md flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    Google Calendar
                  </h4>
                  <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant space-y-sm">
                    <Row label="Event ID" value={detail.google_calendar_event_id} />
                    <a
                      href={detail.google_calendar_event_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-sm text-secondary hover:underline font-label-md text-label-md"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Ver en Google Calendar
                    </a>
                  </div>
                </section>
              )}

              {/* Observations */}
              {detail.observations && (
                <section>
                  <h4 className="font-title-sm text-title-sm text-primary mb-md flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[18px]">notes</span>
                    Observaciones
                  </h4>
                  <p className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant font-body-md text-body-md text-on-surface">
                    {detail.observations}
                  </p>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-xl py-lg border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-lg py-sm rounded-lg border border-outline-variant font-label-md text-label-md hover:bg-surface-container-high transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}