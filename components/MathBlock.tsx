import katex from "katex";

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
      <p>{explanation}</p>
    </section>
  );
}
