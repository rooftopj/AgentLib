import type { RichBlock } from "@/lib/papers";
import CodeBlock from "./CodeBlock";
import CodeWalkthrough from "./CodeWalkthrough";
import MathBlock from "./MathBlock";

function Callout({ block }: { block: Extract<RichBlock, { type: "callout" }> }) {
  return (
    <aside className={`callout ${block.tone}`}>
      <strong>{block.title}</strong>
      <p>{block.body}</p>
    </aside>
  );
}

function Diagram({ block }: { block: Extract<RichBlock, { type: "diagram" }> }) {
  return (
    <figure className="diagram">
      <figcaption>
        <h3>{block.title}</h3>
        <p>{block.caption}</p>
      </figcaption>
      <div className="diagram-flow">
        {block.nodes.map((node, index) => (
          <div className="diagram-step" key={node.id}>
            <span>{node.label}</span>
            {index < block.nodes.length - 1 ? <em>{block.edges[index]?.[2] || "下一步"}</em> : null}
          </div>
        ))}
      </div>
    </figure>
  );
}

function ResultTable({ block }: { block: Extract<RichBlock, { type: "table" }> }) {
  return (
    <section className="result-table" id={block.id}>
      <h3>{block.title}</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {block.columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td className={block.highlightColumn === index ? "emphasis-cell" : ""} key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function RichContentRenderer({ blocks }: { blocks: RichBlock[] }) {
  return (
    <div className="rich-content">
      {blocks.map((block, index) => {
        if (block.type === "section") {
          return (
            <section className="content-section" id={block.id} key={block.id}>
              {block.kicker ? <p className="eyebrow">{block.kicker}</p> : null}
              <h2>{block.title}</h2>
              <p>{block.body}</p>
            </section>
          );
        }
        if (block.type === "callout") return <Callout block={block} key={`${block.title}-${index}`} />;
        if (block.type === "code") return <CodeBlock {...block} key={`${block.filename}-${index}`} />;
        if (block.type === "walkthrough") return <CodeWalkthrough {...block} key={block.title} />;
        if (block.type === "diagram") return <Diagram block={block} key={block.title} />;
        if (block.type === "table") return <ResultTable block={block} key={block.title} />;
        if (block.type === "math") return <MathBlock {...block} key={block.formula} />;
        return null;
      })}
    </div>
  );
}
