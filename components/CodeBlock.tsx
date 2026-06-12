"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

type CodeBlockProps = {
  id?: string;
  code: string;
  language: string;
  filename?: string;
  highlights?: number[];
  caption?: string;
};

const keywordPattern = new Set([
  "and",
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "def",
  "else",
  "except",
  "export",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "import",
  "in",
  "let",
  "new",
  "not",
  "or",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

function tokenClass(token: string) {
  if (/^(#|\/\/)/.test(token)) return "token-comment";
  if (/^['"`]/.test(token)) return "token-string";
  if (/^\d/.test(token)) return "token-number";
  if (keywordPattern.has(token)) return "token-keyword";
  return "";
}

function highlightLine(line: string, language: string): ReactNode[] {
  if (!/^(python|py|javascript|js|typescript|ts|tsx|jsx)$/.test(language)) return [line || " "];

  const nodes: ReactNode[] = [];
  const tokenPattern = /(#.*$|\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(line)) !== null) {
    if (match.index > lastIndex) nodes.push(line.slice(lastIndex, match.index));
    const token = match[0];
    const className = tokenClass(token);
    nodes.push(className ? <span className={className} key={`${match.index}-${token}`}>{token}</span> : token);
    lastIndex = tokenPattern.lastIndex;
  }

  if (lastIndex < line.length) nodes.push(line.slice(lastIndex));
  return nodes.length > 0 ? nodes : [" "];
}

export default function CodeBlock({ id, code, language, filename, highlights = [], caption }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const highlighted = useMemo(() => new Set(highlights), [highlights]);
  const lines = code.trimEnd().split("\n");

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <figure className="code-figure" id={id}>
      <figcaption className="code-toolbar">
        <span>{filename || language}</span>
        <button className={copied ? "copied" : ""} type="button" onClick={copyCode} aria-live="polite">
          {copied ? "已复制" : "复制"}
        </button>
      </figcaption>
      <pre className={`code-block language-${language}`}>
        <code>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            return (
              <span className={highlighted.has(lineNumber) ? "code-line highlighted" : "code-line"} key={lineNumber}>
                <span className="line-number">{lineNumber}</span>
                <span>{highlightLine(line, language)}</span>
              </span>
            );
          })}
        </code>
      </pre>
      {caption ? <p className="figure-caption">{caption}</p> : null}
    </figure>
  );
}
