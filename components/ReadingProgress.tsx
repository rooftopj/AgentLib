"use client";

import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const article = document.querySelector<HTMLElement>(".paper-article, .immersive-paper");
    if (!article) return;

    setEnabled(true);

    const update = () => {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const read = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total <= 0 ? 1 : read / total);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="reading-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
