import { useState } from "react";

// Renders an AI landing photo with a premium warm-mesh fallback.
// If the .webp isn't present yet (design-time gen not run), the mesh shows —
// so the layout reads as intentional. Drop the file in and it lights up.
const MESHES = {
  hero:
    "radial-gradient(120% 120% at 12% 8%, #FBE7D6 0%, transparent 46%)," +
    "radial-gradient(120% 120% at 92% 18%, #E6E1F6 0%, transparent 52%)," +
    "radial-gradient(150% 130% at 62% 105%, #D8EDDE 0%, transparent 58%)," +
    "linear-gradient(150deg, #F7F2EA, #EEE8DD)",
  warm:
    "radial-gradient(120% 120% at 18% 12%, #F8E5D3 0%, transparent 52%)," +
    "radial-gradient(120% 120% at 86% 88%, #E4DEF4 0%, transparent 56%)," +
    "linear-gradient(150deg, #F5F0E7, #ECE5DA)",
  green:
    "radial-gradient(120% 120% at 22% 16%, #DCEEDF 0%, transparent 52%)," +
    "radial-gradient(120% 120% at 82% 82%, #ECE5F6 0%, transparent 56%)," +
    "linear-gradient(150deg, #F1F5ED, #E6EEE6)",
  terra:
    "radial-gradient(120% 120% at 20% 14%, #F6DEC9 0%, transparent 52%)," +
    "radial-gradient(120% 120% at 84% 84%, #E6E0F4 0%, transparent 56%)," +
    "linear-gradient(150deg, #F6EFE6, #EFE6DB)",
};

export default function LandingImage({
  src,
  alt = "",
  tone = "hero",
  priority = false,
  className,
  style,
  imgStyle,
  overlay,
  children,
}) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;

  return (
    <div className={className} style={{ position: "relative", overflow: "hidden", background: MESHES[tone] || MESHES.hero, ...style }}>
      {showImg && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          // eslint-disable-next-line react/no-unknown-property
          fetchpriority={priority ? "high" : "auto"}
          decoding="async"
          onError={() => setFailed(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", ...imgStyle }}
        />
      )}
      {overlay && <div style={{ position: "absolute", inset: 0, background: overlay, pointerEvents: "none" }} />}
      {children}
    </div>
  );
}
