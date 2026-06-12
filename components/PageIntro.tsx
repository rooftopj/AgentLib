type PageIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function PageIntro({ eyebrow, title, description, children, className = "" }: PageIntroProps) {
  return (
    <section className={`page-intro${className ? ` ${className}` : ""}`}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children ? <div className="page-intro-aside">{children}</div> : null}
    </section>
  );
}
