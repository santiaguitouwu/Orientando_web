import { apiRequest } from "./api";

const COOKIE_NAME = "orientando_auth";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

interface LoginResponse {
  user: { id: number; login: string; rol: string };
  token: string;
  refreshToken: string;
}

function setAuthCookie(token: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
}

function clearAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export async function login(login: string, password: string): Promise<LoginResponse> {
  const res = await apiRequest<LoginResponse>("/api/auth/getToken", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  });
  setAuthCookie(res.data.token);
  return res.data;
}

export function logout() {
  clearAuthCookie();
}

export function isAuthenticated(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_NAME}=`);
}