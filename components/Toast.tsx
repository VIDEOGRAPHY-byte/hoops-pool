"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type = "success", onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : "120%"})`,
        transition: "transform 0.3s ease",
        background: type === "success" ? "var(--success)" : "var(--error)",
        color: "#fff",
        padding: "0.65rem 1.25rem",
        borderRadius: "var(--radius)",
        fontWeight: 600,
        fontSize: "0.875rem",
        zIndex: 9999,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}
