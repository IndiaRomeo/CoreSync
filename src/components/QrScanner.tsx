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
        qrbox: 220,
      },
      (decodedText) => {
        onResult(decodedText);
      },
      () => {} // <--- cuarto argumento, callback de error vacío
    );

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, [onResult]);

  return (
    <div
      ref={qrRef}
      id="reader"
      style={{ width: 250, height: 250, ...style }}
    />
  );
}