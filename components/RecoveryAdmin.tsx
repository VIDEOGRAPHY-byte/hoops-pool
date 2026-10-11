"use client";
import { useState } from "react";

export default function RecoveryAdmin({ pools, participants }: {
  pools: { id: string; name: string }[];
  participants: { id: string; pool_id: string; display_name: string }[];
}) {
  const [pool, setPool] = useState("");
  const [member, setMember] = useState("");
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <section className="card" style={{ marginTop: "2rem", padding: "1.5rem" }}>
    <h2>Participant recovery</h2>
    <p>Verify the person through a trusted channel you already use. Knowing a name or pool passcode is not proof of identity.</p>
    <form style={{ display: "grid", gap: "1rem" }} onSubmit={async (e) => {
      e.preventDefault(); if (busy) return; setBusy(true); setCode(""); setError("");
      try {
        const response = await fetch("/api/admin/recovery", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: member, poolId: pool, identityVerified: verified }) });
        const result = await response.json();
        if (!response.ok) setError(result.error ?? "Could not issue code."); else setCode(result.code);
      } catch { setError("Could not issue code. Please try again."); } finally { setBusy(false); }
    }}>
      <label>Pool <select required disabled={busy} value={pool} onChange={(e) => { setPool(e.target.value); setMember(""); setVerified(false); setCode(""); }}>
        <option value="">Select a pool</option>{pools.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.id.slice(0, 8)})</option>)}
      </select></label>
      <label>Participant <select required disabled={busy} value={member} onChange={(e) => { setMember(e.target.value); setVerified(false); setCode(""); }}>
        <option value="">Select a participant</option>{participants.filter((p) => p.pool_id === pool).map((p) => <option key={p.id} value={p.id}>{p.display_name} ({p.id.slice(0, 8)})</option>)}
      </select></label>
      <label><input type="checkbox" required disabled={busy} checked={verified} onChange={(e) => setVerified(e.target.checked)} /> I independently verified this participant’s identity.</label>
      <button type="submit" className="btn-accent" disabled={busy || !verified || !member}>{busy ? "Issuing…" : "Issue one-time code"}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {code && <div><p>Share this code through the verified channel. It expires in 30 minutes; issuing another invalidates it. It will not be shown again after leaving this page.</p><code style={{ overflowWrap: "anywhere" }}>{code}</code><button onClick={() => setCode("")}>Hide code</button></div>}
  </section>;
}
