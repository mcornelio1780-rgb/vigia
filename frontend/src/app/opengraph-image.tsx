import { ImageResponse } from "next/og";

export const alt = "Vigia — Inteligencia climática satelital para el campo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#080D0B",
          color: "#E8F2EA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "28px" }}>
          <div style={{ display: "flex", width: "44px", height: "44px", borderRadius: "10px", background: "#0E2019", alignItems: "center", justifyContent: "center", color: "#3DDC84", fontSize: "30px", fontWeight: 700 }}>
            V
          </div>
          <div style={{ display: "flex", fontSize: "40px", fontWeight: 700 }}>Vigia</div>
        </div>
        <div style={{ display: "flex", fontSize: "68px", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-2px", maxWidth: "900px" }}>
          El incendio empieza seis horas antes de que lo veas.
        </div>
        <div style={{ display: "flex", marginTop: "32px", fontSize: "28px", color: "#93AC9C", maxWidth: "820px" }}>
          Inteligencia climática satelital · incendio, sequía, inundación, plaga y helada · zona por zona
        </div>
        <div style={{ display: "flex", marginTop: "40px", fontSize: "24px", color: "#3DDC84" }}>vigia.ag</div>
      </div>
    ),
    { ...size }
  );
}
