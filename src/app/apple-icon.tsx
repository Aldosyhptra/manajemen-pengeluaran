import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 120,
            height: 140,
            background: "white",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            padding: "14px 12px",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 22, height: 6, background: "#2B59C3", borderRadius: 4 }} />
            <div style={{ width: 16, height: 6, background: "#D5DCE6", borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            <div style={{ height: 5, background: "#D5DCE6", borderRadius: 4, width: "85%" }} />
            <div style={{ height: 5, background: "#D5DCE6", borderRadius: 4, width: "70%" }} />
            <div style={{ height: 5, background: "#D5DCE6", borderRadius: 4, width: "90%" }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
