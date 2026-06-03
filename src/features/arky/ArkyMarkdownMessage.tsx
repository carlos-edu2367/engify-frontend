import type { ReactNode } from "react";

type MarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "code"; text: string };

interface ArkyMarkdownMessageProps {
  content: string;
}

export function ArkyMarkdownMessage({ content }: ArkyMarkdownMessageProps) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-2 break-words leading-relaxed">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

export function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length === 1 ? 2 : 3,
        text: heading[2],
      });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i].trim())) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function isBlockStart(line: string): boolean {
  return (
    line.startsWith("```") ||
    /^(#{1,3})\s+/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line)
  );
}

function renderBlock(block: MarkdownBlock, key: number): ReactNode {
  if (block.type === "heading") {
    const className = block.level === 2
      ? "text-sm font-semibold text-foreground"
      : "text-xs font-semibold text-foreground";
    const HeadingTag = block.level === 2 ? "h2" : "h3";
    return <HeadingTag key={key} className={className}>{renderInline(block.text)}</HeadingTag>;
  }

  if (block.type === "unordered-list") {
    return (
      <ul key={key} className="ml-4 list-disc space-y-1">
        {block.items.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "ordered-list") {
    return (
      <ol key={key} className="ml-4 list-decimal space-y-1">
        {block.items.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ol>
    );
  }

  if (block.type === "code") {
    return (
      <pre key={key} className="max-w-full overflow-x-auto rounded-md border border-border bg-background/80 px-2 py-1.5 text-xs leading-relaxed text-foreground">
        <code>{block.text}</code>
      </pre>
    );
  }

  return <p key={key} className="whitespace-pre-wrap">{renderInline(block.text)}</p>;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${nodes.length}`;
    if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-background/80 px-1 py-0.5 text-[0.85em] text-foreground">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key} className="font-semibold">{renderInline(token.slice(2, -2))}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{renderInline(token.slice(1, -1))}</em>);
    } else {
      nodes.push(renderLink(token, key));
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderLink(token: string, key: string): ReactNode {
  const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
  if (!match) return token;

  const [, label, href] = match;
  if (!isSafeHref(href)) {
    return label;
  }

  return (
    <a
      key={key}
      href={href}
      target={href.startsWith("/") ? undefined : "_blank"}
      rel={href.startsWith("/") ? undefined : "noreferrer"}
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      {label}
    </a>
  );
}

function isSafeHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://") || href.startsWith("mailto:");
}
