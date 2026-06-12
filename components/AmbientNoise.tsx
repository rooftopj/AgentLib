"use client";

import { useEffect, useRef } from "react";

export default function AmbientNoise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size = 256;
    let frame = 0;
    let animationId = 0;

    const resize = () => {
      canvas.width = size;
      canvas.height = size;
    };

    const draw = () => {
      const imageData = context.createImageData(size, size);
      const data = imageData.data;

      for (let index = 0; index < data.length; index += 4) {
        const value = 198 + Math.random() * 42;
        data[index] = value;
        data[index + 1] = value * 0.98;
        data[index + 2] = value * 0.9;
        data[index + 3] = 13;
      }

      context.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      if (frame % 8 === 0) draw();
      frame += 1;
      animationId = window.requestAnimationFrame(loop);
    };

    resize();
    draw();
    if (!reduceMotion) loop();

    return () => window.cancelAnimationFrame(animationId);
  }, []);

  return <canvas aria-hidden="true" className="ambient-noise" ref={canvasRef} />;
}
