"use client";

import { useEffect } from "react";
import * as amplitude from "@amplitude/unified";

let initialized = false;

export function AmplitudeProvider() {
  useEffect(() => {
    if (!initialized) {
      amplitude.initAll("6805c116aaaec04bd0f139741e82656c", {
        analytics: { autocapture: true },
        sessionReplay: { sampleRate: 1 },
      });
      initialized = true;
    }
  }, []);

  return null;
}
