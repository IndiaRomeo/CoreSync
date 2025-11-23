// src/components/QrScanner.tsx
"use client";
import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onResult: (result: string) => void;
  style?: React.CSSProperties;
}

export default function QrScanner({ onResult, style }: QrScannerProps) {
  const qrRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!qrRef.current) return;

    scannerRef.current = new Html5Qrcode(qrRef.current.id);

    scannerRef.current.start(
      { facingMode: "environment" },
      {
        fps: 10,
        // OJO: sin `qrbox` para que NO dibuje el marco blanco
        // si algún día quieres recortar el área de lectura,
        // se puede volver a poner, pero tocaría ocultar el borde con CSS.
        disableFlip: true,
      },
      (decodedText) => {
        onResult(decodedText);
      },
      () => {}
    );

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
        className="rounded-3xl overflow-hidden"
      />

      {/* 🟩 Marco verde premium */}
      <div
        className="
          pointer-events-none
          absolute
          w-[220px]
          h-[220px]
          rounded-[28px]
          border-[4px]
          border-emerald-400
        "
      />
    </div>
  );
}