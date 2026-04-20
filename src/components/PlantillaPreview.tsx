"use client";

import { ExternalLink } from "lucide-react";
import type { PlantillaBoton } from "@/types/database";

type Props = {
  headerTipo: "text" | "image" | null;
  headerContenido: string | null;
  cuerpo: string;
  footer: string | null;
  botones: PlantillaBoton[];
  size?: "md" | "sm";
  /** Render the body with variables already replaced (plain text, no {{N}} highlighting) */
  renderedCuerpo?: string;
};

function renderCuerpoConVariables(cuerpo: string): React.ReactNode {
  const parts = cuerpo.split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{\d+\}\}$/.test(part)) {
      return (
        <span
          key={i}
          className="bg-f7blue/20 text-f7blue px-1 rounded font-medium"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PlantillaPreview({
  headerTipo,
  headerContenido,
  cuerpo,
  footer,
  botones,
  size = "md",
  renderedCuerpo,
}: Props) {
  const frameClass =
    size === "sm"
      ? "max-w-[220px] mx-auto rounded-[1.25rem] border-[6px] border-gray-900 bg-[#e5ddd5] p-3 shadow-xl"
      : "max-w-sm mx-auto rounded-[2rem] border-[10px] border-gray-900 bg-[#e5ddd5] p-4 shadow-xl";
  const bubbleTextClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={frameClass}>
      <div className="bg-white rounded-lg p-3 shadow space-y-2 max-w-[90%]">
        {headerTipo === "text" && headerContenido && (
          <div className="font-semibold text-sm text-gray-900">{headerContenido}</div>
        )}
        {headerTipo === "image" && headerContenido && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headerContenido}
            alt="header"
            className="rounded max-h-40 object-cover w-full"
          />
        )}
        <p className={`${bubbleTextClass} whitespace-pre-wrap text-gray-800 break-words`}>
          {renderedCuerpo !== undefined ? renderedCuerpo : renderCuerpoConVariables(cuerpo)}
        </p>
        {footer && <p className="text-[11px] text-gray-500">{footer}</p>}
        {botones.length > 0 && (
          <div className="-mx-3 -mb-3 mt-2 border-t border-gray-200">
            {botones.map((b, i) => (
              <button
                key={i}
                type="button"
                className={`block w-full text-center py-2 text-blue-600 ${
                  size === "sm" ? "text-xs" : "text-sm"
                } font-medium ${i < botones.length - 1 ? "border-b border-gray-200" : ""}`}
              >
                {b.tipo === "url" ? (
                  <span className="inline-flex items-center gap-1">
                    {b.texto}
                    <ExternalLink size={size === "sm" ? 10 : 12} />
                  </span>
                ) : (
                  b.texto
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
