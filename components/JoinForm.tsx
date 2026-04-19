"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinPool } from "@/app/(pool)/actions";

export default function JoinForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function formAction(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await joinPool(formData);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  const pending = isPending;

  return (
    <form action={formAction as unknown as string} onSubmit={(e) => { e.preventDefault(); formAction(new FormData(e.currentTarget)); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label
          htmlFor="displayName"
          style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}
        >
          YOUR NAME
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="e.g. Jordan"
          required
          style={{
            width: "100%",
            padding: "0.65rem 0.9rem",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--text)",
            fontSize: "1rem",
            outline: "none",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="passcode"
          style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}
        >
          POOL PASSCODE
        </label>
        <input
          id="passcode"
          name="passcode"
          type="text"
          placeholder="e.g. HOOPS2026"
          required
          style={{
            width: "100%",
            padding: "0.65rem 0.9rem",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--text)",
            fontSize: "1rem",
            outline: "none",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        />
      </div>

      {error && (
        <p style={{ color: "var(--error)", fontSize: "0.875rem" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-accent"
        style={{ marginTop: "0.25rem", width: "100%", padding: "0.75rem" }}
      >
        {pending ? "Joining…" : "Enter Pool →"}
      </button>
    </form>
  );
}
