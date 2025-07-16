"use client";
import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export default function SnowParticles() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  // Opciones de nieve más fluida
  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: true, zIndex: 0 },
      background: { color: { value: "#000" } }, // tu fondo
      particles: {
        color: { value: "#fff" },
        move: {
          direction: "bottom",
          enable: true,
          speed: 1.3,           // velocidad mayor
          random: true,
          straight: false
        },
        number: { value: 90, density: { enable: true, area: 900 } }, // más partículas
        opacity: { value: { min: 0.3, max: 0.7 }, random: true },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 }, random: true },
      },
      detectRetina: true,
    }),
    []
  );

  if (!init) return null;
  return (
    <Particles
      id="snow-particles"
      options={options}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}