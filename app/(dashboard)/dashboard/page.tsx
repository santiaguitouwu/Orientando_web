"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface DashboardStats {
  total_clientes: number;
  total_profesionales: number;
  citas_mes_actual: number;
  citas_hoy: number;
  total_mensajes_chat: number;
  citas_canceladas_mes: number;
  citas_por_mes: { mes: string; total: number }[];
  citas_por_estado: { estado: string; total: number }[];
  proximas_citas: {
    cita_id: number;
    hora_inicio: string;
    hora_fin: string;
    cliente_nombres: string;
    cliente_apellidos: string;
    servicio: string;
    profesional_nombres: string;
    estado: string;
  }[];
}

const MES_LABELS: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function mesLabel(yyyymm: string) {
  const [, mm] = yyyymm.split("-");
  return MES_LABELS[mm] ?? yyyymm;
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function estadoColor(estado: string) {
  const e = estado.toUpperCase();
  if (e.includes("CANCEL")) return "bg-error-container text-on-error-container";
  if (e.includes("CONFIRM") || e.includes("FINALIZ")) return "bg-tertiary-container text-on-tertiary-container";
  if (e.includes("PENDIENTE")) return "bg-secondary-container text-on-secondary-container";
  return "bg-surface-container text-on-surface-variant";
}

export default function DashboardPage() {
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<DashboardStats>("/api/dashboard/stats");
      setStats(res.data ?? null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const maxCitasMes = stats ? Math.max(...stats.citas_por_mes.map((m) => m.total), 1) : 1;
  const maxEstado   = stats ? Math.max(...stats.citas_por_estado.map((e) => e.total), 1) : 1;

  const citasAgendadas = stats?.citas_por_estado.find((e) => e.estado === "AGENDADO")?.total ?? 0;
  const tasaExito = stats?.citas_mes_actual
    ? Math.round(((stats.citas_mes_actual - (stats.citas_canceladas_mes ?? 0)) / stats.citas_mes_actual) * 100)
    : 0;

  return (
    <div className="p-lg bg-background overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="flex items-center justify-between mb-xl">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Dashboard</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-base">
            Resumen del sistema · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-sm px-lg py-sm rounded-lg border border-outline-variant font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
          Actualizar
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-2xl">
          <span className="material-symbols-outlined animate-spin text-on-surface-variant text-[40px]">progress_activity</span>
        </div>
      ) : !stats ? (
        <div className="text-center py-2xl text-on-surface-variant font-body-md text-body-md">
          No se pudo cargar la información.
        </div>
      ) : (
        <>
          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-lg mb-xl">
            <MetricCard
              icon="group"
              label="Clientes"
              value={stats.total_clientes}
              color="secondary"
            />
            <MetricCard
              icon="badge"
              label="Profesionales"
              value={stats.total_profesionales}
              color="tertiary"
            />
            <MetricCard
              icon="event"
              label="Citas este mes"
              value={stats.citas_mes_actual}
              color="secondary"
            />
            <MetricCard
              icon="today"
              label="Citas hoy"
              value={stats.citas_hoy}
              color="tertiary"
            />
            <MetricCard
              icon="forum"
              label="Mensajes chat"
              value={stats.total_mensajes_chat}
              color="secondary"
            />
            <MetricCard
              icon="verified"
              label="Tasa de éxito"
              value={tasaExito}
              suffix="%"
              color="tertiary"
              sub={`${stats.citas_canceladas_mes} canceladas`}
            />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">

            {/* Bar: citas por mes */}
            <div className="lg:col-span-2 bg-surface rounded-xl border border-outline-variant shadow-sm p-lg">
              <div className="flex items-center justify-between mb-lg">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Citas por mes</h3>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Últimos 6 meses</span>
              </div>
              {stats.citas_por_mes.length === 0 ? (
                <p className="text-center py-xl text-on-surface-variant font-body-md text-body-md">Sin datos.</p>
              ) : (
                <div className="flex items-end gap-sm h-48 px-sm">
                  {stats.citas_por_mes.map((m) => {
                    const pct = Math.round((m.total / maxCitasMes) * 100);
                    return (
                      <div key={m.mes} className="flex-1 flex flex-col items-center gap-xs">
                        <span className="font-label-md text-[11px] text-on-surface-variant">{m.total}</span>
                        <div className="w-full relative flex items-end" style={{ height: "160px" }}>
                          <div
                            className="w-full rounded-t-md bg-secondary transition-all duration-500"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <span className="font-label-md text-[11px] text-on-surface-variant">{mesLabel(m.mes)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List: citas por estado */}
            <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">
                Estados este mes
              </h3>
              {stats.citas_por_estado.length === 0 ? (
                <p className="text-center py-xl text-on-surface-variant font-body-md text-body-md">Sin datos.</p>
              ) : (
                <div className="space-y-md">
                  {stats.citas_por_estado.map((e) => (
                    <div key={e.estado}>
                      <div className="flex justify-between mb-xs">
                        <span className="font-body-sm text-body-sm text-on-surface truncate max-w-[180px]" title={e.estado}>
                          {e.estado}
                        </span>
                        <span className="font-label-md text-label-md text-on-surface-variant flex-shrink-0 ml-sm">{e.total}</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5">
                        <div
                          className="bg-secondary h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((e.total / maxEstado) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Próximas citas hoy ── */}
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px]">calendar_today</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Citas de hoy</h3>
                <span className="ml-sm px-sm py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                  {stats.citas_hoy}
                </span>
              </div>
              <Link href="/customers" className="font-label-md text-label-md text-secondary hover:underline">
                Ver clientes
              </Link>
            </div>

            {stats.proximas_citas.length === 0 ? (
              <div className="py-xl text-center text-on-surface-variant font-body-md text-body-md">
                No hay citas programadas para hoy.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md">
                      {["Hora", "Cliente", "Servicio", "Profesional", "Estado"].map((h) => (
                        <th key={h} className="px-lg py-md border-b border-outline-variant whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {stats.proximas_citas.map((cita) => (
                      <tr key={cita.cita_id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-lg py-md whitespace-nowrap">
                          <p className="font-body-md text-body-md text-on-surface font-semibold">{formatHora(cita.hora_inicio)}</p>
                          <p className="font-body-sm text-[11px] text-on-surface-variant">{formatHora(cita.hora_fin)}</p>
                        </td>
                        <td className="px-lg py-md">
                          <p className="font-body-md text-body-md text-on-surface font-semibold">
                            {cita.cliente_nombres} {cita.cliente_apellidos}
                          </p>
                        </td>
                        <td className="px-lg py-md">
                          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[200px] truncate">{cita.servicio}</p>
                        </td>
                        <td className="px-lg py-md">
                          <p className="font-body-md text-body-md text-on-surface">{cita.profesional_nombres}</p>
                        </td>
                        <td className="px-lg py-md">
                          <span className={`inline-flex px-sm py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wide ${estadoColor(cita.estado)}`}>
                            {cita.estado.length > 20 ? cita.estado.substring(0, 20) + "…" : cita.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Metric Card ─────────────────────────────────────────────────────────── */

function MetricCard({
  icon, label, value, suffix = "", color, sub,
}: {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  color: "secondary" | "tertiary";
  sub?: string;
}) {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-lg hover:border-secondary transition-colors">
      <div className="flex items-center justify-between mb-md">
        <span className={`material-symbols-outlined text-${color} p-xs bg-${color}-container/20 rounded-lg`}>
          {icon}
        </span>
      </div>
      <p className="font-label-md text-label-md text-on-surface-variant mb-xs">{label}</p>
      <p className="font-display-lg text-display-lg text-on-surface leading-none">
        {value.toLocaleString("es-CO")}
        {suffix && <span className="font-headline-sm text-headline-sm ml-0.5">{suffix}</span>}
      </p>
      {sub && <p className="font-body-sm text-[11px] text-on-surface-variant mt-xs">{sub}</p>}
    </div>
  );
}