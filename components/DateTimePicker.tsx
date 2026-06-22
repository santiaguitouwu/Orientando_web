"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  value: string;        // "DD/MM/YYYY HH:mm" or ""
  onChange: (v: string) => void;
  placeholder?: string;
}

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const WEEKDAYS = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];
const MINUTES   = [0,5,10,15,20,25,30,35,40,45,50,55];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7; }

function parse(v: string) {
  const rx = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;
  const m = v.match(rx);
  if (!m) return null;
  return { d: +m[1], mo: +m[2] - 1, y: +m[3], h: +m[4], mi: +m[5] };
}

function fmt(d: number, mo: number, y: number, h: number, mi: number) {
  return `${String(d).padStart(2,"0")}/${String(mo+1).padStart(2,"0")}/${y} ${String(h).padStart(2,"0")}:${String(mi).padStart(2,"0")}`;
}

const POPOVER_W = 292;
const POPOVER_H = 420; // estimated max height

export default function DateTimePicker({ value, onChange, placeholder = "Seleccionar fecha y hora" }: Props) {
  const now = new Date();
  const p   = parse(value);

  const [open, setOpen]       = useState(false);
  const [viewY, setViewY]     = useState(p?.y  ?? now.getFullYear());
  const [viewM, setViewM]     = useState(p?.mo ?? now.getMonth());
  const [selDay, setSelDay]   = useState<{ d:number; mo:number; y:number } | null>(
    p ? { d: p.d, mo: p.mo, y: p.y } : null
  );
  const [hour,   setHour]     = useState(p?.h  ?? 8);
  const [minute, setMinute]   = useState(p?.mi ?? 0);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync from external value changes
  useEffect(() => {
    const parsed = parse(value);
    if (parsed) {
      setSelDay({ d: parsed.d, mo: parsed.mo, y: parsed.y });
      setViewY(parsed.y); setViewM(parsed.mo);
      setHour(parsed.h);  setMinute(parsed.mi);
    } else if (!value) {
      setSelDay(null);
    }
  }, [value]);

  // Compute fixed position when opening
  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp     = spaceBelow < POPOVER_H + 8;
    const left       = Math.min(rect.left, window.innerWidth - POPOVER_W - 8);

    setPopoverStyle(openUp
      ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left, width: POPOVER_W, zIndex: 9999 }
      : { position: "fixed", top: rect.bottom + 4,                      left, width: POPOVER_W, zIndex: 9999 }
    );
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const inside = triggerRef.current?.contains(t) || popoverRef.current?.contains(t);
      if (!inside) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Recompute position on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    const update = () => computePosition();
    window.addEventListener("scroll",  update, true);
    window.addEventListener("resize",  update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [open, computePosition]);

  function handleToggle() {
    if (!open) computePosition();
    setOpen(o => !o);
  }

  function prevMonth() {
    if (viewM === 0) { setViewM(11); setViewY(y => y - 1); }
    else setViewM(m => m - 1);
  }
  function nextMonth() {
    if (viewM === 11) { setViewM(0); setViewY(y => y + 1); }
    else setViewM(m => m + 1);
  }

  function pickDay(d: number) {
    setSelDay({ d, mo: viewM, y: viewY });
    onChange(fmt(d, viewM, viewY, hour, minute));
  }

  function changeHour(h: number) {
    setHour(h);
    if (selDay) onChange(fmt(selDay.d, selDay.mo, selDay.y, h, minute));
  }
  function changeMinute(mi: number) {
    setMinute(mi);
    if (selDay) onChange(fmt(selDay.d, selDay.mo, selDay.y, hour, mi));
  }

  function goToday() {
    const t  = new Date();
    const h  = t.getHours();
    const mi = MINUTES.reduce((a, b) => Math.abs(b - t.getMinutes()) < Math.abs(a - t.getMinutes()) ? b : a);
    setViewY(t.getFullYear()); setViewM(t.getMonth());
    setHour(h); setMinute(mi);
    setSelDay({ d: t.getDate(), mo: t.getMonth(), y: t.getFullYear() });
    onChange(fmt(t.getDate(), t.getMonth(), t.getFullYear(), h, mi));
  }

  // Calendar grid
  const totalDays = daysInMonth(viewY, viewM);
  const offset    = firstWeekday(viewY, viewM);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d: number) => selDay?.d === d && selDay.mo === viewM && selDay.y === viewY;
  const isToday    = (d: number) => d === now.getDate() && viewM === now.getMonth() && viewY === now.getFullYear();

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-sm px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-lg text-left transition-all focus:ring-1 focus:ring-secondary focus:border-secondary outline-none hover:border-outline"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-[18px] flex-shrink-0">calendar_month</span>
        <span className={`font-body-md text-body-md ${value ? "text-on-surface" : "text-on-surface-variant/50"}`}>
          {value || placeholder}
        </span>
      </button>

      {/* Popover — rendered with position:fixed to escape any overflow:hidden ancestor */}
      {open && (
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="bg-surface border border-outline-variant rounded-xl shadow-2xl p-md select-none"
        >
          {/* Month / year nav */}
          <div className="flex items-center justify-between mb-sm">
            <button type="button" onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="font-title-sm text-title-sm text-on-surface">
              {MONTH_NAMES[viewM]} {viewY}
            </span>
            <button type="button" onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-xs">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center font-label-md text-[11px] uppercase tracking-wide text-on-surface-variant py-xs">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((d, i) => (
              <div key={i} className="flex items-center justify-center py-[2px]">
                {d ? (
                  <button
                    type="button"
                    onClick={() => pickDay(d)}
                    className={`w-9 h-9 rounded-full text-[13px] font-body-md transition-all
                      ${isSelected(d)
                        ? "bg-secondary text-on-secondary font-semibold shadow-sm"
                        : isToday(d)
                          ? "border-2 border-secondary text-secondary font-semibold hover:bg-secondary/10"
                          : "text-on-surface hover:bg-surface-container-high"
                      }`}
                  >
                    {d}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* Time selector */}
          <div className="mt-md pt-md border-t border-outline-variant">
            <div className="flex items-center justify-center gap-md">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">schedule</span>

              {/* Hour */}
              <div className="flex flex-col items-center gap-xs">
                <button type="button" onClick={() => changeHour((hour + 1) % 24)}
                  className="w-8 h-6 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
                <div className="w-10 h-9 flex items-center justify-center bg-surface-container-lowest border border-outline-variant rounded-lg font-data-mono text-data-mono text-on-surface font-semibold">
                  {String(hour).padStart(2, "0")}
                </div>
                <button type="button" onClick={() => changeHour((hour + 23) % 24)}
                  className="w-8 h-6 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>

              <span className="font-headline-sm text-on-surface pb-1">:</span>

              {/* Minute */}
              <div className="flex flex-col items-center gap-xs">
                <button type="button" onClick={() => changeMinute(MINUTES[(MINUTES.indexOf(minute) + 1) % MINUTES.length])}
                  className="w-8 h-6 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[16px]">expand_less</span>
                </button>
                <div className="w-10 h-9 flex items-center justify-center bg-surface-container-lowest border border-outline-variant rounded-lg font-data-mono text-data-mono text-on-surface font-semibold">
                  {String(minute).padStart(2, "0")}
                </div>
                <button type="button" onClick={() => changeMinute(MINUTES[(MINUTES.indexOf(minute) + MINUTES.length - 1) % MINUTES.length])}
                  className="w-8 h-6 flex items-center justify-center rounded hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-md flex items-center justify-between">
            <button type="button" onClick={goToday}
              className="font-label-md text-[12px] text-secondary hover:underline">
              Hoy
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-md py-xs bg-secondary text-on-secondary rounded-lg font-label-md text-[12px] hover:opacity-90 transition-opacity">
              Listo
            </button>
          </div>
        </div>
      )}
    </>
  );
}