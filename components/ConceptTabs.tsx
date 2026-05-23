"use client";

import { useMemo, useState } from "react";

type ConceptTabsProps = {
  tabs: string;
  panels: string;
};

export default function ConceptTabs({ tabs, panels }: ConceptTabsProps) {
  const items = useMemo(() => {
    const labels = tabs.split("|").map((item) => item.trim()).filter(Boolean);
    const bodies = panels.split("|").map((item) => item.trim());
    return labels.map((label, index) => ({ label, body: bodies[index] || "" }));
  }, [panels, tabs]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];

  if (items.length === 0) return null;

  return (
    <section className="concept-tabs">
      <div className="concept-tab-list" role="tablist">
        {items.map((item, index) => (
          <button
            aria-selected={activeIndex === index}
            className={activeIndex === index ? "active" : ""}
            key={item.label}
            onClick={() => setActiveIndex(index)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <p>{active?.body}</p>
    </section>
  );
}
