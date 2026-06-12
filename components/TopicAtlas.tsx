"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Boxes, Braces, Network } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ContentTypeBadge from "@/components/ContentTypeBadge";
import type { AtlasResource, AtlasTopicGroupView } from "@/lib/atlas";

function relatedEdges(group: AtlasTopicGroupView, nodeId: string) {
  return group.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}

function connectedNodeIds(group: AtlasTopicGroupView, nodeId: string) {
  const ids = new Set([nodeId]);
  relatedEdges(group, nodeId).forEach((edge) => {
    ids.add(edge.from);
    ids.add(edge.to);
  });
  return ids;
}

function edgeGeometry(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const start = { x: from.x + ux * 55, y: from.y + uy * 55 };
  const end = { x: to.x - ux * 62, y: to.y - uy * 62 };
  const arrowLength = 13;
  const arrowWidth = 8;
  const base = { x: end.x - ux * arrowLength, y: end.y - uy * arrowLength };
  const left = { x: base.x + -uy * arrowWidth, y: base.y + ux * arrowWidth };
  const right = { x: base.x - -uy * arrowWidth, y: base.y - ux * arrowWidth };

  return {
    start,
    end,
    arrowPoints: `${end.x},${end.y} ${left.x},${left.y} ${right.x},${right.y}`,
    label: {
      x: (start.x + end.x) / 2 + -uy * 18,
      y: (start.y + end.y) / 2 + ux * 18
    }
  };
}

export default function TopicAtlas({ groups, showSidebar = true }: { groups: AtlasTopicGroupView[]; showSidebar?: boolean }) {
  const [activeGroupSlug, setActiveGroupSlug] = useState(groups[0]?.slug || "");
  const activeGroup = groups.find((group) => group.slug === activeGroupSlug) || groups[0];
  const [selectedNodeId, setSelectedNodeId] = useState(activeGroup?.nodes[0]?.id || "");

  const selectedNode = activeGroup.nodes.find((node) => node.id === selectedNodeId) || activeGroup.nodes[0];
  const selectedEdges = useMemo(() => selectedNode ? relatedEdges(activeGroup, selectedNode.id) : [], [activeGroup, selectedNode]);
  const connectedIds = useMemo(() => selectedNode ? connectedNodeIds(activeGroup, selectedNode.id) : new Set<string>(), [activeGroup, selectedNode]);
  const [selectedResourceKey, setSelectedResourceKey] = useState("");
  const selectedResources = selectedNode?.resources || [];
  const selectedResource = selectedResources.find((resource) => resourceKey(resource) === selectedResourceKey) || selectedResources[0];

  useEffect(() => {
    setSelectedResourceKey(selectedResources[0] ? resourceKey(selectedResources[0]) : "");
  }, [selectedNode?.id]);

  function selectGroup(slug: string) {
    const nextGroup = groups.find((group) => group.slug === slug);
    setActiveGroupSlug(slug);
    setSelectedNodeId(nextGroup?.nodes[0]?.id || "");
  }

  return (
    <div className={showSidebar ? "atlas-workspace" : "atlas-workspace atlas-workspace-single"}>
      {showSidebar ? (
        <aside className="atlas-sidebar" aria-label="主题分类">
          <div className="atlas-sidebar-title">
            <Network size={18} aria-hidden="true" />
            <span>主题域</span>
          </div>
          <div className="atlas-topic-tabs">
            {groups.map((group) => (
              <button
                className={group.slug === activeGroup.slug ? "active" : ""}
                key={group.slug}
                onClick={() => selectGroup(group.slug)}
                type="button"
              >
                <span>{group.label}</span>
                <small>{group.nodes.length ? `${group.nodes.length} 个机制 · ${group.resourceCount} 个资源` : "暂无机制"}</small>
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <section className="atlas-map-panel" aria-label={`${activeGroup.label}主题图谱`}>
        <div className="atlas-map-heading">
          <div>
            <p className="eyebrow">主题图谱</p>
            <h2>{activeGroup.label}</h2>
            <p>{activeGroup.framing}</p>
          </div>
        </div>

        <div className="atlas-canvas">
          <svg className="atlas-svg" viewBox="0 0 800 500" role="img" aria-label={`${activeGroup.label}机制节点关系图`}>
            <defs>
              <filter id="atlasGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="9" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle className="atlas-orbit orbit-one" cx="410" cy="250" r="180" />
            <circle className="atlas-orbit orbit-two" cx="410" cy="250" r="126" />
            {activeGroup.edges.map((edge) => {
              const from = activeGroup.nodes.find((node) => node.id === edge.from);
              const to = activeGroup.nodes.find((node) => node.id === edge.to);
              if (!from || !to) return null;

              const active = selectedNode ? edge.from === selectedNode.id || edge.to === selectedNode.id : false;
              const geometry = edgeGeometry(from, to);
              return (
                <g className={active ? "atlas-edge active" : "atlas-edge"} key={`${edge.from}-${edge.to}`}>
                  <line x1={geometry.start.x} y1={geometry.start.y} x2={geometry.end.x} y2={geometry.end.y} />
                  <polygon points={geometry.arrowPoints} />
                  {active ? (
                    <g className="atlas-edge-label">
                      <rect
                        height="28"
                        rx="7"
                        width={Math.max(86, edge.label.length * 15)}
                        x={geometry.label.x - Math.max(86, edge.label.length * 15) / 2}
                        y={geometry.label.y - 19}
                      />
                      <text x={geometry.label.x} y={geometry.label.y}>{edge.label}</text>
                    </g>
                  ) : null}
                </g>
              );
            })}
            {activeGroup.nodes.map((node) => {
              const active = node.id === selectedNode.id;
              const connected = connectedIds.has(node.id);
              return (
                <g
                  className={[
                    "atlas-node",
                    `tone-${node.tone}`,
                    active ? "active" : "",
                    connected ? "connected" : "dimmed"
                  ].join(" ")}
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setSelectedNodeId(node.id);
                  }}
                >
                  <circle cx={node.x} cy={node.y} r={active ? 54 : 47} />
                  <text className="node-label" x={node.x} y={node.y - 4}>{node.shortLabel}</text>
                  <text className="node-count" x={node.x} y={node.y + 18}>{node.resourceCount} 个资源</text>
                </g>
              );
            })}
          </svg>
          {activeGroup.nodes.length === 0 ? (
            <div className="atlas-empty-state">
              <strong>暂无机制图谱</strong>
              <p>{activeGroup.description}</p>
            </div>
          ) : null}
        </div>

        {activeGroup.nodes.length ? (
          <div className="atlas-node-strip" aria-label="机制节点列表">
            {activeGroup.nodes.map((node) => (
              <button
                className={selectedNode && node.id === selectedNode.id ? "active" : ""}
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                type="button"
              >
                <span>{node.label}</span>
                <small>{node.resourceCount} 个关联资源</small>
              </button>
            ))}
          </div>
        ) : null}

        {selectedResources.length ? (
          <div className="atlas-map-resources" aria-label="相关资源">
            <div className="atlas-panel-heading">
              <BookOpen size={17} aria-hidden="true" />
              <h3>相关资源</h3>
            </div>
            <div className="atlas-resource-rail">
              {selectedResources.map((resource) => {
                const active = selectedResource && resourceKey(resource) === resourceKey(selectedResource);
                return (
                  <article className={active ? "atlas-resource-tile active" : "atlas-resource-tile"} key={resourceKey(resource)}>
                    <button onClick={() => setSelectedResourceKey(resourceKey(resource))} type="button">
                      {resource.coverImageUrl ? <img src={resource.coverImageUrl} alt="" aria-hidden="true" /> : null}
                      <span className="paper-meta"><ContentTypeBadge type={resource.type} />{resource.categoryLabel}</span>
                      <strong>{resource.title}</strong>
                      <small>{resource.summary}</small>
                    </button>
                    <Link href={resource.href}>打开资源 <ArrowRight size={14} aria-hidden="true" /></Link>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="atlas-detail-panel" aria-label="节点详情" key={`${activeGroup.slug}-${selectedNode?.id || "empty"}`}>
        {selectedNode ? (
          <>
            <div className={`atlas-detail-card tone-${selectedNode.tone}`}>
              <p className="paper-meta"><Braces size={15} aria-hidden="true" />当前机制</p>
              <h2>{selectedNode.label}</h2>
              <p>{selectedNode.description}</p>
              <div className="tag-row">
                {selectedNode.keywords.slice(0, 6).map((keyword) => (
                  <span className="tag" key={keyword}>{keyword}</span>
                ))}
              </div>
            </div>

            <div className="atlas-relation-card">
              <div className="atlas-panel-heading">
                <Boxes size={17} aria-hidden="true" />
                <h3>关联关系</h3>
              </div>
              {selectedEdges.map((edge) => {
                const otherId = edge.from === selectedNode.id ? edge.to : edge.from;
                const other = activeGroup.nodes.find((node) => node.id === otherId);
                return (
                  <button className="atlas-relation" key={`${edge.from}-${edge.to}`} onClick={() => setSelectedNodeId(otherId)} type="button">
                    <span>{edge.from === selectedNode.id ? "指向" : "来自"}</span>
                    <strong>{other?.label}</strong>
                    <em>{edge.label}</em>
                  </button>
                );
              })}
            </div>

            <div className="atlas-highlight-card">
              <div className="atlas-panel-heading">
                <BookOpen size={17} aria-hidden="true" />
                <h3>资源亮点</h3>
              </div>
              {selectedResource ? (
                <ResourceHighlights resource={selectedResource} />
              ) : (
                <p className="atlas-empty-copy">选择一个机制节点后，这里会展示相关资源的设计亮点。</p>
              )}
            </div>
          </>
        ) : (
          <div className="atlas-detail-card">
            <p className="paper-meta"><Braces size={15} aria-hidden="true" />当前主题</p>
            <h2>{activeGroup.label}</h2>
            <p>{activeGroup.description}</p>
            <div className="tag-row">
              <span className="tag">暂无机制节点</span>
              <span className="tag">待沉淀资源关系</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function resourceKey(resource: AtlasResource) {
  return `${resource.type}:${resource.slug}`;
}

function ResourceHighlights({ resource }: { resource: AtlasResource }) {
  return (
    <div className="atlas-highlight-detail">
      <p className="paper-meta"><ContentTypeBadge type={resource.type} />{resource.categoryLabel} · {resource.meta}</p>
      <h4>{resource.title}</h4>
      {resource.highlights.length ? (
        <ol className="atlas-highlight-list">
          {resource.highlights.map((highlight) => (
            <li key={`${resourceKey(resource)}-${highlight.title}`}>
              <strong>{highlight.title}</strong>
              <span>{highlight.body}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="atlas-empty-copy">这个资源还没有生成图谱亮点。运行 agent-knowledge-atlas skill 后会补齐。</p>
      )}
      <Link className="atlas-highlight-link" href={resource.href}>打开完整资源 <ArrowRight size={14} aria-hidden="true" /></Link>
    </div>
  );
}
