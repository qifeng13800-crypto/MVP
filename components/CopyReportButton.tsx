"use client";

import { useMemo, useState } from "react";
import { Clipboard, Check } from "lucide-react";

export function CopyReportButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copyText = useMemo(() => text, [text]);

  async function handleCopy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyText);
      } else {
        fallbackCopy(copyText);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      try {
        fallbackCopy(copyText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        setCopied(false);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-aqua px-4 text-sm font-semibold text-bg transition hover:bg-[#7df0d7]"
    >
      {copied ? <Check size={17} /> : <Clipboard size={17} />}
      {copied ? "已复制" : "复制报告"}
    </button>
  );
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
