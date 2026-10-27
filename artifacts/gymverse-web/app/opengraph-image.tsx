import { ImageResponse } from "next/og";

export const alt = "GYMX: Fitness without judgment or distraction. Early access waitlist open.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link-preview image for shares on Discord, iMessage, X, etc. Uses system fonts only (no network). */
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
          padding: "72px 84px",
          color: "#FFF7ED",
          backgroundColor: "#090909",
          backgroundImage:
            "radial-gradient(circle at 70% 38%, rgba(255, 90, 31, 0.38), transparent 42%), radial-gradient(circle at 88% 80%, rgba(255, 46, 46, 0.26), transparent 40%), radial-gradient(circle at 18% 88%, rgba(255, 209, 102, 0.12), transparent 36%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 900, letterSpacing: 2 }}>
            <span>GYM</span>
            <span style={{ color: "#FF5A1F" }}>X</span>
          </div>
          <div style={{ display: "flex", padding: "6px 16px", borderRadius: 999, border: "2px solid rgba(255,90,31,0.6)", color: "#FF5A1F", fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>
            BETA ACCESS
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, fontSize: 84, fontWeight: 900, lineHeight: 1.02, letterSpacing: -1 }}>
          <span>FITNESS WITHOUT</span>
          <span style={{ color: "#FF5A1F" }}>JUDGMENT OR DISTRACTION.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 44, fontSize: 30, color: "#A3A3A3" }}>
          <span>No judgment. Just progress.</span>
          <span style={{ color: "#FFD166", fontWeight: 700 }}>Founding 500 waitlist open</span>
        </div>
      </div>
    ),
    size,
  );
}
