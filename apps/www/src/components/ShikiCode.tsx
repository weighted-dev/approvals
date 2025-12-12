import { useState, useEffect } from "react";
import { codeToHtml } from "shiki";

interface ShikiCodeProps {
  code: string;
  lang: string;
}

export function ShikiCode({ code, lang }: ShikiCodeProps) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    codeToHtml(code, {
      lang,
      theme: "github-dark",
    }).then(setHtml);
  }, [code, lang]);

  if (!html) {
    // Fallback while loading
    return (
      <pre
        className="p-4 overflow-x-auto text-sm leading-relaxed font-mono"
        style={{ color: "var(--color-fg-default)" }}
      >
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="shiki-wrapper overflow-x-auto text-sm [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:m-0 [&_code]:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
