import React from "react";
import { ImageResponse } from "next/og";

/** PNG-иконка сферы для favicon / apple-touch (Яндекс и Google не всегда берут SVG). */
export function renderSferaIcon(size: number) {
  const sphere = Math.round(size * 0.72);
  const radius = Math.round(size * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0f",
          borderRadius: radius,
        }}
      >
        <div
          style={{
            width: sphere,
            height: sphere,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 38% 32%, #5eead4 0%, #2dd4bf 35%, #64748b 70%, #1e293b 100%)",
            boxShadow: `0 0 ${Math.max(8, Math.round(size * 0.12))}px rgba(20,184,166,0.45)`,
          }}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
