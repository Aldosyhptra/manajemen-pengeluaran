import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2B59C3",
          // safe area for maskable
          padding: 64,
        }}
      >
        <div
          style={{
            width: 320,
            height: 380,
            background: "white",
            borderRadius: 28,
            display: "flex",
            flexDirection: "column",
            padding: "32px 28px",
            gap: 18,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 56, height: 12, background: "#2B59C3", borderRadius: 6 }} />
            <div style={{ width: 40, height: 12, background: "#D5DCE6", borderRadius: 6 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <div style={{ height: 10, background: "#D5DCE6", borderRadius: 6, width: "85%" }} />
            <div style={{ height: 10, background: "#D5DCE6", borderRadius: 6, width: "70%" }} />
            <div style={{ height: 10, background: "#D5DCE6", borderRadius: 6, width: "90%" }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div style={{ flex: 1, height: 64, background: "#F4F6F8", borderRadius: 14 }} />
            <div style={{ flex: 1, height: 64, background: "#F4F6F8", borderRadius: 14 }} />
          </div>
          <div style={{ height: 10, background: "#2B59C3", borderRadius: 6, width: "55%", marginTop: 4 }} />
        </div>
      </div>
    ),
    size,
  );
}
