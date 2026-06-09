"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";

interface SystemUser {
  id: number;
  login: string;
  rol: "ADMIN" | "CONSULTA";
  status: boolean;
  creation_date: string;
  update_date: string;
}

const inputCls = "w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all";
const labelCls = "font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function UserManagementPage() {
  const [users, setUsers]       = useState<SystemUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser]     = useState<SystemUser | null>(null);
  const [pwdUser, setPwdUser]       = useState<SystemUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<SystemUser[]>("/api/system-users");
      setUsers(res.data ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleToggle(user: SystemUser) {
    try {
      await apiRequest(`/api/system-users/${user.id}/toggle`, { method: "PATCH" });
      fetchUsers();
    } catch { /* silent */ }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.login.toLowerCase().includes(q) || u.rol.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto p-lg bg-background custom-scrollbar">

      {/* Header */}
      <div className="mb-xl flex items-start justify-between">
        <div>
          <h3 className="font-display-lg text-display-lg text-on-surface">Usuarios del sistema</h3>
          <p className="text-on-surface-variant font-body-md text-body-md mt-base">
            Gestión de cuentas con acceso al panel de administración.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-sm px-lg py-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-lg max-w-sm">
        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          className="w-full pl-xl pr-md py-sm bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
          placeholder="Buscar por login o rol…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-container-lowest">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            {loading ? "Cargando…" : `${filtered.length} usuario${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loading ? (
          <div className="py-2xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-2xl text-center text-on-surface-variant font-body-md text-body-md">
            {search ? "No se encontraron usuarios." : "No hay usuarios registrados."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-on-surface-variant font-label-md text-label-md">
                  {["Login", "Rol", "Estado", "Creado", "Acciones"].map((h) => (
                    <th key={h} className="px-lg py-md border-b border-outline-variant whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={() => setEditUser(user)}
                    onToggle={() => handleToggle(user)}
                    onPassword={() => setPwdUser(user)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <UserModal
          user={null}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); fetchUsers(); }}
        />
      )}
      {editUser && (
        <UserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); fetchUsers(); }}
        />
      )}
      {pwdUser && (
        <PasswordModal
          user={pwdUser}
          onClose={() => setPwdUser(null)}
          onSaved={() => { setPwdUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}

/* ─── Row ─────────────────────────────────────────────────────────────────── */

interface RowProps {
  user: SystemUser;
  onEdit: () => void;
  onToggle: () => void;
  onPassword: () => void;
}

function UserRow({ user, onEdit, onToggle, onPassword }: RowProps) {
  return (
    <tr className="hover:bg-surface-container-low transition-colors">

      <td className="px-lg py-md">
        <div className="flex items-center gap-sm">
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
          </div>
          <span className="font-body-md text-body-md text-on-surface font-semibold">{user.login}</span>
        </div>
      </td>

      <td className="px-lg py-md">
        <span className={`inline-flex items-center gap-xs px-sm py-0.5 rounded-full font-label-sm text-label-sm ${
          user.rol === "ADMIN"
            ? "bg-error-container text-on-error-container"
            : "bg-secondary-container text-on-secondary-container"
        }`}>
          <span className="material-symbols-outlined text-[12px]">
            {user.rol === "ADMIN" ? "admin_panel_settings" : "visibility"}
          </span>
          {user.rol}
        </span>
      </td>

      <td className="px-lg py-md">
        <span className={`inline-flex items-center gap-xs px-sm py-0.5 rounded-full font-label-sm text-label-sm ${
          user.status
            ? "bg-tertiary-container text-on-tertiary-container"
            : "bg-surface-container text-on-surface-variant"
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {user.status ? "Activo" : "Inactivo"}
        </span>
      </td>

      <td className="px-lg py-md">
        <span className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(user.creation_date)}</span>
      </td>

      <td className="px-lg py-md">
        <div className="flex items-center gap-xs">
          <button
            onClick={onEdit}
            title="Editar"
            className="p-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button
            onClick={onPassword}
            title="Cambiar contraseña"
            className="p-xs rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">key</span>
          </button>
          <button
            onClick={onToggle}
            title={user.status ? "Desactivar" : "Activar"}
            className={`p-xs rounded-lg hover:bg-surface-container-high transition-colors ${
              user.status ? "text-error" : "text-tertiary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {user.status ? "person_off" : "person_check"}
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Create / Edit Modal ─────────────────────────────────────────────────── */

interface UserModalProps {
  user: SystemUser | null;
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ user, onClose, onSaved }: UserModalProps) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    login:    user?.login    ?? "",
    password: "",
    rol:      user?.rol      ?? "CONSULTA" as "ADMIN" | "CONSULTA",
  });
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await apiRequest(`/api/system-users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({ login: form.login, rol: form.rol }),
        });
      } else {
        await apiRequest("/api/system-users", {
          method: "POST",
          body: JSON.stringify({ login: form.login, password: form.password, rol: form.rol }),
        });
      }
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">

        <div className="flex items-start justify-between px-xl py-lg border-b border-outline-variant">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {isEdit ? "Editar usuario" : "Nuevo usuario"}
            </h3>
            {isEdit && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Para cambiar la contraseña usa el botón de llave.
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="user-form" onSubmit={handleSubmit} className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">

          <div className="space-y-base">
            <label className={labelCls}>Login <span className="text-error">*</span></label>
            <input
              className={inputCls}
              value={form.login}
              onChange={(e) => set("login", e.target.value)}
              required
              minLength={3}
              maxLength={50}
              autoComplete="off"
            />
          </div>

          {!isEdit && (
            <div className="space-y-base">
              <label className={labelCls}>Contraseña <span className="text-error">*</span></label>
              <input
                className={inputCls}
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          )}

          <div className="space-y-base">
            <label className={labelCls}>Rol <span className="text-error">*</span></label>
            <div className="flex gap-md">
              {(["ADMIN", "CONSULTA"] as const).map((rol) => (
                <label
                  key={rol}
                  className={`flex-1 flex items-center gap-sm p-md rounded-lg border-2 cursor-pointer transition-colors ${
                    form.rol === rol
                      ? "border-secondary bg-secondary-container/20"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <input
                    type="radio"
                    name="rol"
                    value={rol}
                    checked={form.rol === rol}
                    onChange={() => set("rol", rol)}
                    className="accent-secondary"
                  />
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{rol}</p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">
                      {rol === "ADMIN" ? "Acceso total y gestión de usuarios" : "Solo lectura y consulta"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
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
            form="user-form"
            disabled={saving}
            className="px-lg py-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-sm"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            {isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── Change Password Modal ───────────────────────────────────────────────── */

interface PwdModalProps {
  user: SystemUser;
  onClose: () => void;
  onSaved: () => void;
}

function PasswordModal({ user, onClose, onSaved }: PwdModalProps) {
  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setSaveError("Las contraseñas no coinciden.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await apiRequest(`/api/system-users/${user.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ newPassword: form.newPassword }),
      });
      onSaved();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
      <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">

        <div className="flex items-start justify-between px-xl py-lg border-b border-outline-variant">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Cambiar contraseña</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{user.login}</p>
          </div>
          <button onClick={onClose} className="p-xs rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="pwd-form" onSubmit={handleSubmit} className="overflow-y-auto px-xl py-lg space-y-lg custom-scrollbar">

          <div className="space-y-base">
            <label className={labelCls}>Nueva contraseña <span className="text-error">*</span></label>
            <input
              className={inputCls}
              type="password"
              value={form.newPassword}
              onChange={(e) => set("newPassword", e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-base">
            <label className={labelCls}>Confirmar contraseña <span className="text-error">*</span></label>
            <input
              className={inputCls}
              type="password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
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
            form="pwd-form"
            disabled={saving}
            className="px-lg py-sm rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-sm"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            Cambiar contraseña
          </button>
        </div>

      </div>
    </div>
  );
}