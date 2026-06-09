"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/api";

interface Conversation {
  numero: string;
  total_mensajes: number;
  ultimo_mensaje_at: string;
  ultimo_mensaje: string;
  ultima_direccion: "IN" | "OUT";
}

interface Message {
  id: number;
  numero: string;
  direccion: "IN" | "OUT";
  mensaje: string;
  sent_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "ahora";
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function formatPhone(numero: string) {
  if (!numero) return numero;
  return `+${numero.slice(0, 2)} ${numero.slice(2)}`;
}

export default function ChatAuditPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convPagination, setConvPagination] = useState<Pagination | null>(null);
  const [convPage, setConvPage] = useState(1);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgPagination, setMsgPagination] = useState<Pagination | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgPage, setMsgPage] = useState(1);

  const threadRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async (page: number) => {
    setLoadingConvs(true);
    try {
      const res = await apiRequest<Conversation[]>(`/api/chat-history?limit=25&page=${page}`);
      setConversations(res.data ?? []);
      setConvPagination(res.pagination ?? null);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { fetchConversations(convPage); }, [fetchConversations, convPage]);

  const fetchThread = useCallback(async (numero: string, page: number) => {
    setLoadingMsgs(true);
    try {
      const res = await apiRequest<Message[]>(`/api/chat-history/${encodeURIComponent(numero)}?limit=50&page=${page}`);
      setMessages(res.data ?? []);
      setMsgPagination(res.pagination ?? null);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  function selectConversation(numero: string) {
    setSelected(numero);
    setMsgPage(1);
    setMessages([]);
    fetchThread(numero, 1);
  }

  useEffect(() => {
    if (selected) fetchThread(selected, msgPage);
  }, [msgPage, selected, fetchThread]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (msgPage === 1 && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, msgPage]);

  const filtered = conversations.filter((c) =>
    !search || c.numero.includes(search) || formatPhone(c.numero).includes(search)
  );

  const selectedConv = conversations.find((c) => c.numero === selected);

  // Group messages by date
  const grouped = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const day = formatDate(msg.sent_at);
    (acc[day] ??= []).push(msg);
    return acc;
  }, {});

  return (
    <div className="flex overflow-hidden bg-background" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Left: conversation list ── */}
      <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-outline-variant bg-surface overflow-hidden">

        <div className="px-lg py-md border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">Chat Audit</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              className="w-full pl-xl pr-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-body-sm text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
              placeholder="Buscar número…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingConvs ? (
            <div className="py-xl text-center text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-xl text-center font-body-sm text-body-sm text-on-surface-variant">
              No hay conversaciones.
            </p>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.numero}
                onClick={() => selectConversation(conv.numero)}
                className={`w-full text-left px-lg py-md border-b border-outline-variant transition-colors hover:bg-surface-container-low ${
                  selected === conv.numero ? "bg-secondary-container/30 border-l-4 border-l-secondary" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-sm">
                  <div className="flex items-center gap-sm min-w-0">
                    <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-md text-body-md text-on-surface font-semibold truncate">{formatPhone(conv.numero)}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {conv.ultima_direccion === "OUT" && <span className="text-secondary">Bot: </span>}
                        {conv.ultimo_mensaje}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-xs">
                    <span className="font-body-sm text-[11px] text-on-surface-variant">{timeAgo(conv.ultimo_mensaje_at)}</span>
                    <span className="font-body-sm text-[10px] bg-surface-container px-xs py-0.5 rounded text-on-surface-variant">
                      {conv.total_mensajes} msg
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Conversation pagination */}
        {convPagination && convPagination.total_pages > 1 && (
          <div className="px-lg py-md border-t border-outline-variant flex justify-between items-center">
            <button
              disabled={convPage <= 1}
              onClick={() => setConvPage((p) => p - 1)}
              className="p-xs rounded hover:bg-surface-container-high disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {convPage} / {convPagination.total_pages}
            </span>
            <button
              disabled={convPage >= convPagination.total_pages}
              onClick={() => setConvPage((p) => p + 1)}
              className="p-xs rounded hover:bg-surface-container-high disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Right: message thread ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-md">
            <span className="material-symbols-outlined text-[48px] opacity-30">forum</span>
            <p className="font-body-md text-body-md">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-xl py-md border-b border-outline-variant bg-surface flex items-center gap-md">
              <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
              </div>
              <div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">{formatPhone(selected)}</p>
                {selectedConv && (
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    {selectedConv.total_mensajes} mensajes · último {timeAgo(selectedConv.ultimo_mensaje_at)}
                  </p>
                )}
              </div>
              <button
                onClick={() => fetchThread(selected, msgPage)}
                className="ml-auto p-xs rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
                title="Actualizar"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
            </div>

            {/* Load older messages */}
            {msgPagination && msgPage < msgPagination.total_pages && (
              <div className="text-center py-sm border-b border-outline-variant bg-surface">
                <button
                  onClick={() => setMsgPage((p) => p + 1)}
                  className="font-body-sm text-body-sm text-secondary hover:underline"
                >
                  Cargar mensajes anteriores
                </button>
              </div>
            )}

            {/* Messages */}
            <div ref={threadRef} className="flex-1 overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar bg-surface-container-lowest">
              {loadingMsgs ? (
                <div className="flex justify-center py-xl">
                  <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center font-body-sm text-body-sm text-on-surface-variant py-xl">Sin mensajes.</p>
              ) : (
                Object.entries(grouped).map(([day, msgs]) => (
                  <div key={day}>
                    <div className="flex items-center gap-md mb-md">
                      <div className="flex-1 h-px bg-outline-variant" />
                      <span className="font-body-sm text-[11px] text-on-surface-variant px-sm">{day}</span>
                      <div className="flex-1 h-px bg-outline-variant" />
                    </div>
                    <div className="space-y-sm">
                      {msgs.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direccion === "OUT";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] rounded-2xl px-md py-sm space-y-xs ${
        isOut
          ? "bg-secondary text-on-secondary rounded-br-sm"
          : "bg-surface text-on-surface border border-outline-variant rounded-bl-sm"
      }`}>
        {isOut && (
          <p className={`font-label-sm text-[10px] uppercase tracking-wider ${isOut ? "text-on-secondary/70" : "text-secondary"}`}>
            Bot
          </p>
        )}
        <p className="font-body-md text-body-md whitespace-pre-wrap break-words">{msg.mensaje}</p>
        <p className={`font-body-sm text-[11px] text-right ${isOut ? "text-on-secondary/60" : "text-on-surface-variant"}`}>
          {formatTime(msg.sent_at)}
        </p>
      </div>
    </div>
  );
}