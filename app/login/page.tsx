"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const loginValue = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      await login(loginValue, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al autenticar");
      setLoading(false);
    }
  }

  return (
    <div className="medical-pattern min-h-screen flex items-center justify-center p-md">
      <main className="w-full max-w-[440px]">
        {/* Card */}
        <div className="glass-card border border-outline-variant rounded-xl p-xl shadow-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-xl">
            <div className="bg-secondary p-sm rounded-xl mb-md shadow-sm">
              <span className="material-symbols-outlined text-white text-[32px]">
                health_metrics
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Orientando Admin
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-base">
              Panel de administración
            </p>
          </div>

          <form className="space-y-lg" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-base">
              <label
                className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider"
                htmlFor="email"
              >
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <input
                  className="w-full pl-[44px] pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-secondary-container focus:border-secondary outline-none transition-all placeholder:text-outline-variant"
                  id="email"
                  name="email"
                  placeholder="usuario@orientando.com"
                  required
                  type="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-base">
              <div className="flex justify-between items-center">
                <label
                  className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider"
                  htmlFor="password"
                >
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <input
                  className="w-full pl-[44px] pr-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-secondary-container focus:border-secondary outline-none transition-all placeholder:text-outline-variant"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-sm flex items-center text-outline hover:text-secondary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-sm p-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="w-full bg-secondary text-white font-label-md text-label-md py-md rounded-lg shadow-sm hover:bg-on-secondary-container active:scale-[0.98] transition-all flex items-center justify-center gap-sm group"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                  INGRESANDO...
                </>
              ) : (
                <>
                  <span>INGRESAR</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

        </div>
      </main>

      {/* Backdrop blobs */}
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-secondary-container opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed top-[-50px] left-[-50px] w-[300px] h-[300px] bg-surface-variant opacity-10 rounded-full blur-[80px] pointer-events-none"></div>
    </div>
  );
}
