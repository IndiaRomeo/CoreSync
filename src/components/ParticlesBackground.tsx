"use client";
import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  // Opciones estrictas
  const options: ISourceOptions = useMemo(
    () => ({
      background: { color: { value: "#000000" } },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          onClick: { enable: true, mode: "push" },
          resize: { enable: true },
        },
        modes: {
          repulse: { distance: 80, duration: 0.4 },
          push: { quantity: 2 },
        },
      },
      particles: {
        color: { value: "#ffffff" }, // solo un color
        links: {
          enable: true,
          color: "#ffffff",
          distance: 120,
          opacity: 0.13,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1,
          direction: "none", // string literal válido
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        number: {
          value: 60,
          density: { enable: true, area: 1000 },
        },
        opacity: { value: 0.6, random: true },
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
      id="tsparticles"
      options={options}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -10,
        pointerEvents: "none",
      }}
    />
  );
}