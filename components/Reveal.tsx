"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  threshold?: number;
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
  distance = 22,
  direction = "up",
  threshold = 0.16
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} direction-${direction}${className ? ` ${className}` : ""}`}
      style={{ "--reveal-delay": `${delay}ms`, "--reveal-distance": `${distance}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
