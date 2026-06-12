"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TocGroup } from "@/components/RichMdxRenderer";

type TocNavProps = {
  backHref: string;
  backLabel: string;
  groups: TocGroup[];
  ariaLabel: string;
};

export default function TocNav({ backHref, backLabel, groups, ariaLabel }: TocNavProps) {
  const ids = useMemo(() => groups.flatMap((group) => [group.id, ...group.children.map((child) => child.id)]), [groups]);
  const [activeId, setActiveId] = useState(groups[0]?.id || "");

  useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [ids]);

  return (
    <>
      <Link href={backHref} className="back-link">{backLabel}</Link>
      <nav aria-label={ariaLabel} className="toc-nav">
        {groups.map((group) => (
          <section className={activeId === group.id ? "toc-group active" : "toc-group"} key={group.id}>
            <a className="toc-primary" href={`#${group.id}`}>{group.title}</a>
            {group.children.length > 0 ? (
              <div className="toc-children">
                {group.children.map((child) => (
                  <a className={activeId === child.id ? "active" : ""} href={`#${child.id}`} key={child.id}>
                    {child.title}
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </nav>
    </>
  );
}
