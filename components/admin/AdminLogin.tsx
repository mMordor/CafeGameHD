"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/config";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "ورود انجام نشد.");
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-login-wrap">
      <form className="adm-login" onSubmit={submit}>
        <h1>
          ورود کارکنان <span className="ltr">{SITE.name}</span>
        </h1>
        <p>برای مدیریت رزروها وارد شوید.</p>
        <label>
          نام کاربری
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus dir="ltr" />
        </label>
        <label>
          گذرواژه
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required dir="ltr" />
        </label>
        {error && (
          <p className="adm-error" role="alert">
            {error}
          </p>
        )}
        <button className="adm-btn primary" disabled={busy}>
          {busy ? "در حال ورود…" : "ورود"}
        </button>
      </form>
    </div>
  );
}
