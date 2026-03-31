"use client";

import { useState } from "react";

interface GameImageProps {
  src: string;
  alt: string;
  glowColor: string;
}

export function GameImage({ src, alt, glowColor }: GameImageProps) {
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
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
