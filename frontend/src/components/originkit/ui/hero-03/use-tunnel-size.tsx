"use client";

import { useEffect, useState } from "react";

const IPAD_MIN = 768;
const DESKTOP_SM_MIN = 1280;

export type TunnelConfig = {
  tunnelSize: number;

  fade: number;
  boost: number;
};

export const useTunnelConfig = (): TunnelConfig => {
  const [config, setConfig] = useState<TunnelConfig>({
    tunnelSize: 5,
    fade: 88,
    boost: 30,
  });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < IPAD_MIN) {
        setConfig({ tunnelSize: 5, fade: 88, boost: 30 });
        return;
      }
      if (width < DESKTOP_SM_MIN) {
        setConfig({ tunnelSize: 6, fade: 96, boost: 30 });
        return;
      }

      setConfig({ tunnelSize: 10, fade: 100, boost: 30 });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return config;
};

export const useTunnelSize = (): number => useTunnelConfig().tunnelSize;