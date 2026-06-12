"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  rootMargin?: string;
  threshold?: number;
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
  distance = 22,
  direction = "up",
  rootMargin = "0px 0px 28% 0px",
  threshold = 0.01
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

    const revealIfInRange = () => {
      const rect = node.getBoundingClientRect();
      const preloadDistance = window.innerHeight * 0.28;
      if (rect.top <= window.innerHeight + preloadDistance && rect.bottom >= 0) {
        setVisible(true);
        return true;
      }
      return false;
    };

    if (revealIfInRange()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

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
