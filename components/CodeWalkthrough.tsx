"use client";

import { useState } from "react";
import CodeBlock from "./CodeBlock";

type Step = {
  title: string;
  body: string;
  lines: number[];
};

export default function CodeWalkthrough({ title, language, code, steps }: {
  title: string;
  language: string;
  code: string;
  steps: Step[];
}) {
  const [active, setActive] = useState(0);
  const step = steps[active];

  return (
    <section className="walkthrough">
      <div className="walkthrough-copy">
        <p className="eyebrow">代码讲解</p>
        <h3>{title}</h3>
        <div className="step-tabs" role="tablist" aria-label="代码讲解步骤">
          {steps.map((item, index) => (
            <button
              aria-selected={active === index}
              className={active === index ? "active" : ""}
              key={item.title}
              onClick={() => setActive(index)}
              role="tab"
              type="button"
            >
              {index + 1}
            </button>
          ))}
        </div>
        <h4>{step.title}</h4>
        <p>{step.body}</p>
      </div>
      <CodeBlock code={code} language={language} highlights={step.lines} />
    </section>
  );
}
