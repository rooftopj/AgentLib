export type ContentType = "paper" | "blog" | "project";

const labels: Record<ContentType, string> = {
  paper: "论文",
  blog: "博客",
  project: "开源项目"
};

export default function ContentTypeBadge({ type }: { type: ContentType }) {
  return <span className={`type-badge type-${type}`}>{labels[type]}</span>;
}
