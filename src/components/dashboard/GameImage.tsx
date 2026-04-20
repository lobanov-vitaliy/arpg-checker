"use client";

import { useState } from "react";

interface GameImageProps {
  src: string;
  alt: string;
  glowColor: string;
  // Intrinsic aspect ratio helps browsers reserve space → avoids CLS. Defaults
  // to Steam's 460×215 header aspect (most of our covers come from Steam).
  width?: number;
  height?: number;
  priority?: boolean;
}

export function GameImage({
  src,
  alt,
  glowColor,
  width = 460,
  height = 215,
  priority,
}: GameImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="w-full h-full"
        style={{ background: `radial-gradient(ellipse at top, ${glowColor}40, transparent 70%)` }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="w-full h-full object-cover"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
