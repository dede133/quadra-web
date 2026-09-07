"use client";

import { useState } from "react";

export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: "Quadra",
        text: "Elige tu disponibilidad para el partido",
        url,
      });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }
  return (
    <button
      className="button-secondary w-full sm:w-auto"
      onClick={() => void share()}
    >
      {copied ? "Enlace copiado" : "Compartir enlace"}
    </button>
  );
}
