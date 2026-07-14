import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/branding";

export const alt = `${APP_NAME} — подготовка к ЕГЭ по русскому языку`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 55%, #0d9488 160%)",
          color: "#f4f4f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#5eead4",
            marginBottom: 16,
          }}
        >
          {APP_NAME}
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Подготовка к ЕГЭ по русскому языку
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            color: "#a1a1aa",
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          Группы, задания, тесты и аналитика для репетиторов и учителей
        </div>
      </div>
    ),
    { ...size }
  );
}
