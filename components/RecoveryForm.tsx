"use client";
import { useState, useTransition } from "react";
import { recoverAccess } from "@/app/recover/actions";

export default function RecoveryForm() {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return <form onSubmit={(e) => {
    e.preventDefault(); const form = new FormData(e.currentTarget); setError("");
    start(async () => {
      try { const result = await recoverAccess(form); if (result) setError(result.error); }
      catch { setError("Recovery could not complete. Please try again or ask your organiser."); }
    });
  }} style={{ display: "grid", gap: "1rem", margin: "1rem 0" }}>
    <label htmlFor="recovery-code">Recovery code</label>
    <input id="recovery-code" name="code" type="password" autoComplete="off" spellCheck={false} required minLength={43} maxLength={43} />
    <p>The code expires after 30 minutes and works once. Recovering signs out your other sessions.</p>
    {error && <p role="alert">{error}</p>}
    <button type="submit" className="btn-accent" disabled={pending}>{pending ? "Recovering…" : "Recover access"}</button>
  </form>;
}
