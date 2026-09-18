import { ImageResponse } from "next/og";
import { SEO } from "@/lib/seo";

export const runtime = "edge";
export const alt = SEO.title;
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
          justifyContent: "space-between",
          background: "#0C0C0A",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#FFDD00",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 2,
          }}
        >
          SNAP
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              color: "white",
              fontSize: 64,
              fontWeight: 650,
              lineHeight: 1.1,
              maxWidth: 980,
            }}
          >
            CRM no WhatsApp para o seu time
          </div>
          <div style={{ color: "#A1A1AA", fontSize: 28, maxWidth: 860 }}>
            Inbox, funil e fluxo. A IA tria. O consultor fecha.
          </div>
        </div>
        <div style={{ color: "#FFDD00", fontSize: 24 }}>snap.ia.br</div>
      </div>
    ),
    { ...size },
  );
}
