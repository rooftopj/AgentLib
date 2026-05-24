"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AnnotationItem } from "@/lib/annotations";
import { renderInlineText } from "@/components/InlineText";

type AnnotationBlock =
  | { type: "paragraph"; text: string }
  | { type: "ordered"; items: string[] }
  | { type: "unordered"; items: string[] }
  | { type: "code"; language: string; code: string };

function parseAnnotationBody(body: string): AnnotationBlock[] {
  const blocks: AnnotationBlock[] = [];
  const lines = body.split(/\r?\n/);
  let paragraph: string[] = [];
  let ordered: string[] = [];
  let unordered: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  }

  function flushLists() {
    if (ordered.length > 0) {
      blocks.push({ type: "ordered", items: ordered });
      ordered = [];
    }
    if (unordered.length > 0) {
      blocks.push({ type: "unordered", items: unordered });
      unordered = [];
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      flushParagraph();
      flushLists();
      const language = line.replace(/^```/, "").trim() || "text";
      const code: string[] = [];
      while (index < lines.length - 1) {
        index += 1;
        if (lines[index].trim().startsWith("```")) break;
        code.push(lines[index]);
      }
      blocks.push({ type: "code", language, code: code.join("\n") });
      continue;
    }

    if (!line) {
      flushParagraph();
      flushLists();
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      unordered = [];
      ordered.push(orderedMatch[1]);
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      ordered = [];
      unordered.push(unorderedMatch[1]);
      continue;
    }

    flushLists();
    paragraph.push(line);
  }

  flushParagraph();
  flushLists();
  return blocks;
}

function AnnotationBody({ body }: { body: string }) {
  const blocks = parseAnnotationBody(body);
  return (
    <div className="annotation-body">
      {blocks.map((block, index): ReactNode => {
        if (block.type === "ordered") {
          return (
            <ol key={`ol-${index}`}>
              {block.items.map((item) => <li key={item}>{renderInlineText(item)}</li>)}
            </ol>
          );
        }
        if (block.type === "unordered") {
          return (
            <ul key={`ul-${index}`}>
              {block.items.map((item) => <li key={item}>{renderInlineText(item)}</li>)}
            </ul>
          );
        }
        if (block.type === "code") {
          return (
            <figure className="annotation-code-block" key={`code-${index}`}>
              <figcaption>{block.language}</figcaption>
              <pre><code>{block.code}</code></pre>
            </figure>
          );
        }
        return <p key={`p-${index}`}>{renderInlineText(block.text)}</p>;
      })}
    </div>
  );
}

export default function LearningAnnotations({ annotations }: { annotations: AnnotationItem[] }) {
  const [activeId, setActiveId] = useState("");
  const activeAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === activeId) ?? null,
    [activeId, annotations]
  );

  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".annotation-anchor.active").forEach((anchor) => {
      anchor.classList.remove("active");
    });

    if (!activeId) return;

    document.querySelectorAll<HTMLElement>(`.annotation-anchor[data-annotation-id="${CSS.escape(activeId)}"]`).forEach((anchor) => {
      anchor.classList.add("active");
    });
  }, [activeId]);

  useEffect(() => {
    if (annotations.length === 0) return undefined;

    function activateAnnotation(target: EventTarget | null) {
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLElement>("[data-annotation-id]");
      if (!anchor) return;

      const annotationId = anchor.dataset.annotationId;
      if (!annotationId) return;

      setActiveId(annotationId);

      if (anchor.classList.contains("annotation-card")) {
        document.querySelector<HTMLElement>(`.annotation-anchor[data-annotation-id="${CSS.escape(annotationId)}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      } else {
        document.querySelector<HTMLElement>(`.annotation-card[data-annotation-id="${CSS.escape(annotationId)}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    }

    function handleClick(event: MouseEvent) {
      activateAnnotation(event.target);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".annotation-anchor, .annotation-card")) return;
      event.preventDefault();
      activateAnnotation(target);
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [annotations.length]);

  if (annotations.length === 0) return null;

  return (
    <>
      <aside className="annotation-aside" aria-label="学习批注">
        <div className="annotation-panel">
          <p className="annotation-panel-title">学习批注</p>
          <div className="annotation-list">
            {annotations.map((annotation, index) => (
              <article
                className={`annotation-card${annotation.id === activeId ? " active" : ""}`}
                data-annotation-id={annotation.id}
                key={annotation.id}
                role="button"
                tabIndex={0}
              >
                <span>{index + 1}</span>
                <strong>{annotation.title}</strong>
                <AnnotationBody body={annotation.body} />
              </article>
            ))}
          </div>
        </div>
      </aside>
      <div className={`annotation-drawer${activeAnnotation ? " open" : ""}`} aria-live="polite">
        {activeAnnotation ? (
          <div>
            <button className="annotation-drawer-close" onClick={() => setActiveId("")} type="button" aria-label="关闭批注">
              关闭
            </button>
            <strong>{activeAnnotation.title}</strong>
            <AnnotationBody body={activeAnnotation.body} />
          </div>
        ) : null}
      </div>
    </>
  );
}
