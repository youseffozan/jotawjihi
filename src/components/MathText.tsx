import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Renders text containing inline math delimited by $...$ or $$...$$.
// Uses katex.renderToString directly (no react-katex) to avoid version mismatch.
// Bidi-isolates Arabic (RTL) and math (LTR) so glyphs never overlap.
type Part = { type: "text" | "inline" | "block"; value: string };

function parse(src: string): Part[] {
  const parts: Part[] = [];
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("$$", i)) {
      const end = src.indexOf("$$", i + 2);
      if (end === -1) { parts.push({ type: "text", value: src.slice(i) }); break; }
      parts.push({ type: "block", value: src.slice(i + 2, end) });
      i = end + 2;
    } else if (src[i] === "$") {
      const end = src.indexOf("$", i + 1);
      if (end === -1) { parts.push({ type: "text", value: src.slice(i) }); break; }
      parts.push({ type: "inline", value: src.slice(i + 1, end) });
      i = end + 1;
    } else {
      const nd = src.indexOf("$", i);
      const to = nd === -1 ? src.length : nd;
      parts.push({ type: "text", value: src.slice(i, to) });
      i = to;
    }
  }
  return parts;
}

function renderMath(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      output: "html",
      trust: false,
    });
  } catch {
    return `<code>${tex.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))}</code>`;
  }
}

// Strip leading question numbers like "(4)", "(٤)", "4)", "4." at start of text.
function stripLeadingNumber(s: string): string {
  return s.replace(/^\s*[(（[]?\s*[\d\u0660-\u0669]+\s*[)）\].\-:]\s*/, "");
}

export function MathText({
  children,
  block = false,
  dir = "rtl",
  stripNumber = true,
}: {
  children: string;
  block?: boolean;
  dir?: "rtl" | "ltr";
  stripNumber?: boolean;
}) {
  const cleaned = useMemo(
    () => (stripNumber ? stripLeadingNumber(children ?? "") : children ?? ""),
    [children, stripNumber],
  );
  const parts = useMemo(() => parse(cleaned), [cleaned]);
  if (!children) return null;
  return (
    <span
      dir={dir}
      className={block ? "block leading-relaxed" : "inline"}
      style={{ textAlign: dir === "rtl" ? "right" : "left", unicodeBidi: "isolate" }}
    >
      {parts.map((p, idx) => {
        if (p.type === "text") {
          return (
            <span key={idx} dir={dir} style={{ unicodeBidi: "isolate" }}>
              {p.value}
            </span>
          );
        }
        return (
          <span
            key={idx}
            dir="ltr"
            className="mx-1 align-middle"
            style={{ display: "inline-block", unicodeBidi: "embed", direction: "ltr" }}
            dangerouslySetInnerHTML={{ __html: renderMath(p.value, p.type === "block") }}
          />
        );
      })}
    </span>
  );
}
