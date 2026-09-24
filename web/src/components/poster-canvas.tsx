"use client";

import { MutableRefObject, useEffect, useRef } from "react";
import {
  POSTER_H,
  POSTER_W,
  PosterDraw,
  PosterInput,
  loadPosterPhoto,
  renderPoster,
} from "@/lib/poster";

export interface PosterHandle {
  download: (filename: string) => boolean;
}

export function PosterCanvas({
  input,
  handleRef,
  onDraw,
}: {
  input: PosterInput;
  handleRef: MutableRefObject<PosterHandle | null>;
  onDraw: (result: PosterDraw) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDrawRef = useRef(onDraw);
  onDrawRef.current = onDraw;
  const inputKey = JSON.stringify(input);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const current = JSON.parse(inputKey) as PosterInput;
    let cancelled = false;
    loadPosterPhoto(current.image).then((photo) => {
      if (cancelled) return;
      onDrawRef.current(renderPoster(ctx, current, photo));
    });
    return () => {
      cancelled = true;
    };
  }, [inputKey]);

  useEffect(() => {
    handleRef.current = {
      download: (filename: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return false;
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = filename;
        link.click();
        return true;
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [handleRef]);

  return (
    <canvas
      ref={canvasRef}
      width={POSTER_W}
      height={POSTER_H}
      className="aspect-[3/4] w-full rounded-2xl bg-ink-950"
    />
  );
}
