"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onResult: (result: string) => void;
  style?: React.CSSProperties;
}

export default function QrScanner({ onResult, style }: QrScannerProps) {
  const qrRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hitAnim, setHitAnim] = useState(false);

  useEffect(() => {
    if (!qrRef.current) return;

    scannerRef.current = new Html5Qrcode(qrRef.current.id);

    scannerRef.current
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          disableFlip: true,
          aspectRatio: 1.0, // ✅ esto sí está tipado
        },
        (decodedText) => {
          setHitAnim(true);
          setTimeout(() => setHitAnim(false), 600);
          onResult(decodedText);
        },
        () => {}
      )
      .catch(() => {});

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, [onResult]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Cámara */}
      <div
        ref={qrRef}
        id="reader"
        style={{ width: 260, height: 260, ...style }}
        className="rounded-[32px] overflow-hidden bg-black/60"
      />

      {/* Overlay pro */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative w-[230px] h-[230px]">
          {/* Borde verde */}
          <div
            className={
              "absolute inset-0 rounded-[30px] border-[3px] border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.65)] " +
              (hitAnim ? "qr-success-pulse" : "")
            }
          />

          {/* Línea láser */}
          <div
            className="
              absolute 
              inset-x-6 
              qr-scan-line 
              h-[3px] 
              rounded-full 
              bg-emerald-300/90 
              shadow-[0_0_12px_rgba(16,185,129,0.9)]
            "
          />

          {/* Borde glass */}
          <div className="absolute inset-1 rounded-[28px] ring-1 ring-emerald-400/35" />
        </div>
      </div>
    </div>
  );
}