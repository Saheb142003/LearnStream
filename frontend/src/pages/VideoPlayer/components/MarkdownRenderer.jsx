// frontend/src/pages/VideoPlayer/components/MarkdownRenderer.jsx
//
// Lightweight markdown → React renderer.
// Supports the exact subset Gemini generates:
//   ### / ## / # headers
//   **bold**, *italic*, `inline code`
//   - / * bullet lists
//   numbered lists (1. 2. 3.)
//   > blockquotes
//   ``` fenced code blocks
//   --- horizontal rules
//   blank lines → paragraph breaks

import React from "react";

// ─── Inline parser: bold, italic, inline-code ──────────────────────────────────
function parseInline(text) {
  // Split on **, *, ` delimiters while keeping them
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // *italic* (not **)
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    // `inline code`
    const codeMatch = remaining.match(/`([^`]+)`/);

    // Find which match comes first
    const candidates = [
      boldMatch && {
        idx: boldMatch.index,
        len: boldMatch[0].length,
        type: "bold",
        inner: boldMatch[1],
      },
      italicMatch && {
        idx: italicMatch.index,
        len: italicMatch[0].length,
        type: "italic",
        inner: italicMatch[1],
      },
      codeMatch && {
        idx: codeMatch.index,
        len: codeMatch[0].length,
        type: "code",
        inner: codeMatch[1],
      },
    ]
      .filter(Boolean)
      .sort((a, b) => a.idx - b.idx);

    if (candidates.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    const first = candidates[0];
    if (first.idx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, first.idx)}</span>);
    }

    if (first.type === "bold") {
      parts.push(
        <strong key={key++} className="font-semibold text-gray-900">
          {first.inner}
        </strong>,
      );
    } else if (first.type === "italic") {
      parts.push(
        <em key={key++} className="italic text-gray-700">
          {first.inner}
        </em>,
      );
    } else if (first.type === "code") {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[0.8em] border border-indigo-100"
        >
          {first.inner}
        </code>,
      );
    }

    remaining = remaining.slice(first.idx + first.len);
  }

  return parts;
}

// ─── Block-level renderer ──────────────────────────────────────────────────────
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code blocks ```…``` ──────────────────────────────────────────
    if (line.trimStart().startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={key++}
          className="my-3 rounded-xl bg-gray-900 text-emerald-300 font-mono text-xs p-4 overflow-x-auto border border-gray-800 leading-relaxed"
        >
          {codeLines.join("\n")}
        </pre>,
      );
      i++; // skip closing ```
      continue;
    }

    // ── Horizontal rule ---  ────────────────────────────────────────────────
    if (/^---+$/.test(line.trim())) {
      elements.push(
        <hr
          key={key++}
          className="my-5 border-t border-dashed border-indigo-100"
        />,
      );
      i++;
      continue;
    }

    // ── H3 ### ─────────────────────────────────────────────────────────────
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          className="mt-5 mb-2 text-sm font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1.5"
        >
          <span className="inline-block w-1 h-4 rounded-full bg-indigo-500 shrink-0" />
          {parseInline(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }

    // ── H4 #### ────────────────────────────────────────────────────────────
    if (line.startsWith("#### ")) {
      elements.push(
        <h4
          key={key++}
          className="mt-4 mb-1.5 text-sm font-semibold text-gray-800"
        >
          {parseInline(line.slice(5))}
        </h4>,
      );
      i++;
      continue;
    }

    // ── H2 ## ──────────────────────────────────────────────────────────────
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="mt-6 mb-2 text-base font-bold text-gray-900 border-b border-gray-200 pb-1"
        >
          {parseInline(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }

    // ── H1 # ───────────────────────────────────────────────────────────────
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="mt-4 mb-2 text-lg font-bold text-gray-900">
          {parseInline(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }

    // ── Blockquote > ───────────────────────────────────────────────────────
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={key++}
          className="my-2 pl-3 border-l-4 border-indigo-300 text-gray-600 italic text-sm bg-indigo-50/50 py-1 pr-2 rounded-r-lg"
        >
          {parseInline(line.slice(2))}
        </blockquote>,
      );
      i++;
      continue;
    }

    // ── Unordered list (- or *) ────────────────────────────────────────────
    if (/^(\s*[-*])\s/.test(line)) {
      const items = [];
      const indent = line.match(/^(\s*)/)[1].length;
      while (i < lines.length && /^(\s*[-*])\s/.test(lines[i])) {
        const itemIndent = lines[i].match(/^(\s*)/)[1].length;
        const text = lines[i].replace(/^\s*[-*]\s+/, "");
        items.push(
          <li
            key={items.length}
            className={`flex gap-2 text-gray-700 text-sm leading-relaxed ${itemIndent > indent ? "ml-5" : ""}`}
          >
            <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>{parseInline(text)}</span>
          </li>,
        );
        i++;
      }
      elements.push(
        <ul key={key++} className="my-2 space-y-1.5 pl-1">
          {items}
        </ul>,
      );
      continue;
    }

    // ── Ordered list (1. 2. …) ─────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s+/, "");
        items.push(
          <li
            key={items.length}
            className="flex gap-2.5 text-gray-700 text-sm leading-relaxed"
          >
            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              {num++}
            </span>
            <span>{parseInline(text)}</span>
          </li>,
        );
        i++;
      }
      elements.push(
        <ol key={key++} className="my-2 space-y-1.5 pl-1">
          {items}
        </ol>,
      );
      continue;
    }

    // ── Blank line ─────────────────────────────────────────────────────────
    if (line.trim() === "") {
      i++;
      continue;
    }

    // ── Regular paragraph ──────────────────────────────────────────────────
    elements.push(
      <p key={key++} className="text-sm text-gray-700 leading-relaxed my-1">
        {parseInline(line)}
      </p>,
    );
    i++;
  }

  return <>{elements}</>;
}
