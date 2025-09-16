import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

// Robust render helper that supports callback or Promise style mermaid.render
async function renderMermaid(def: string, containerEl: HTMLDivElement) {
  // Ensure mermaid is initialized (idempotent)
  try {
    mermaid.initialize({ startOnLoad: false });
  } catch { /* ignore */ }

  const uid = 'mermaid-' + Math.random().toString(36).slice(2, 9);
  // Try Promise-style first
  try {
    const maybePromise = (mermaid as unknown as { render: (id: string, def: string) => unknown }).render(uid, def);
    if (maybePromise && typeof (maybePromise as unknown as { then?: unknown }).then === 'function') {
      const svg = await (maybePromise as Promise<unknown>);
      if (typeof svg === 'string') {
        containerEl.innerHTML = svg;
      } else if (svg && (svg as { svg?: string }).svg) {
        containerEl.innerHTML = (svg as { svg: string }).svg;
      } else {
        containerEl.innerHTML = String(svg);
      }
      return;
    }
  } catch {
    // fall through to callback-style
  }
  // Callback-style fallback
  return new Promise<void>((resolve, reject) => {
    try {
      (mermaid as unknown as { render: (id: string, def: string, cb: (svgCode: string) => void, el: HTMLDivElement) => void })
        .render(uid, def, (svgCode: string) => {
          containerEl.innerHTML = svgCode;
          resolve();
        }, containerEl);
    } catch (e) {
      reject(e);
    }
  });
}

export default function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    if (!chart || !chart.trim()) {
      ref.current.innerHTML = '<pre style="color:gray">No diagram to render</pre>';
      return;
    }
    renderMermaid(chart, ref.current).catch(() => {
      if (ref.current) ref.current.innerHTML = '<pre style="color:red">Invalid Mermaid diagram</pre>';
    });
  }, [chart]);

  // Always use light background for the chart
  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        minHeight: 320,
        overflowX: 'auto',
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        transition: 'background 0.2s',
      }}
    />
  );
}
