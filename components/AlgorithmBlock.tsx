"use client";

import { useMemo, useState } from "react";

type AlgorithmBlockProps = {
  title: string;
  code: string;
  explanation?: string;
};

export default function AlgorithmBlock({ title, code, explanation }: AlgorithmBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => code.trimEnd().split("\n"), [code]);

  async function copyAlgorithm() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <figure className="algorithm-block">
      <figcaption>
        <span>
          <em>Algorithm</em>
          <strong>{title}</strong>
        </span>
        <button type="button" onClick={copyAlgorithm}>{copied ? "已复制" : "复制"}</button>
      </figcaption>
      <pre className="algorithm-code">
        <code>
          {lines.map((line, index) => (
            <span className="algorithm-line" key={`${index}-${line}`}>
              <span className="line-number">{index + 1}</span>
              <span>{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
      {explanation ? <p>{explanation}</p> : null}
    </figure>
  );
}
