import katex from "katex";
import { renderInlineText } from "./InlineText";

export default function MathBlock({ title, formula, explanation }: {
  title?: string;
  formula: string;
  explanation: string;
}) {
  const html = katex.renderToString(formula, {
    displayMode: true,
    throwOnError: false,
    strict: "ignore"
  });

  return (
    <section className="math-block">
      {title ? <h3>{title}</h3> : null}
      <div className="formula" dangerouslySetInnerHTML={{ __html: html }} />
      <p>{renderInlineText(explanation)}</p>
    </section>
  );
}
