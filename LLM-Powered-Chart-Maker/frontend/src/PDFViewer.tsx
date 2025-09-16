import { useRef, useEffect, useState } from 'react';

// PDF.js text item type
type TextItem = {
  str: string;
  transform: number[];
};
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

type Highlight = { text: string; color?: string };
interface PDFViewerProps {
  file: File | null;
  onExtractedHighlights?: (highlights: Highlight[]) => void;
}

export default function PDFViewer({ file, onExtractedHighlights }: PDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualHighlights, setManualHighlights] = useState<Highlight[]>([]);
  const [manualText, setManualText] = useState('');
  // Automatically populate the main document/text input with the first extracted highlight
  useEffect(() => {
    if (highlights.length > 0 && manualText === '') {
      setManualText(highlights[0].text);
    }
  }, [highlights, manualText]);

  // Use postMessage to extract selected text from the iframe (works for same-origin PDFs)
  const extractSelectedText = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Ask the iframe to send us the selected text
    iframe.contentWindow?.postMessage({ type: 'GET_SELECTED_TEXT' }, '*');
  };

  // Listen for selected text from the iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SELECTED_TEXT' && event.data.text) {
        setManualHighlights((prev) => [...prev, { text: event.data.text, color: '#ffe066' }]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!file || file.type !== 'application/pdf') return;
    const url = URL.createObjectURL(file);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
    setLoading(true);
    setHighlights([]);
    (async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const allHighlights: Highlight[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const annotations = await page.getAnnotations();
    const textContent = await page.getTextContent();
    for (const ann of annotations) {
            if (ann.subtype === 'Highlight') {
              let color: string | undefined = undefined;
              if (ann.color && Array.isArray(ann.color)) {
                const [r, g, b] = ann.color;
                color = `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
              }
              // Try to extract highlighted text using quadPoints
              let text = '';
              if (ann.quadPoints && Array.isArray(ann.quadPoints)) {
                for (let i = 0; i < ann.quadPoints.length; i += 8) {
                  const quad = ann.quadPoints.slice(i, i + 8);
                  const x1 = Math.min(quad[0], quad[2], quad[4], quad[6]);
                  const x2 = Math.max(quad[0], quad[2], quad[4], quad[6]);
                  const y1 = Math.min(quad[1], quad[3], quad[5], quad[7]);
                  const y2 = Math.max(quad[1], quad[3], quad[5], quad[7]);
                  const items = (textContent.items as TextItem[]).filter((item) => {
                    const tx = item.transform[4];
                    const ty = item.transform[5];
                    return tx >= x1 && tx <= x2 && ty >= y1 && ty <= y2;
                  });
                  text += items.map((item) => item.str).join(' ');
                }
              }
              if (!text && ann.contents) text = ann.contents;
              if (text) {
                allHighlights.push({ text, color });
              }
            }
          }
        }
        // Only show real highlights
        if (allHighlights.length > 0) {
          setHighlights(allHighlights);
          if (onExtractedHighlights) onExtractedHighlights(allHighlights);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
        console.error('Highlight extraction error:', err);
      }
    })();
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, onExtractedHighlights]);

  if (!file || file.type !== 'application/pdf') return null;

  return (
    <div style={{ margin: '16px 0', border: '1px solid #e6eef6', borderRadius: 8, overflow: 'hidden', background: '#23263a' }}>
      <iframe
        ref={iframeRef}
        title="PDF Preview"
        width="100%"
        height={500}
        style={{ border: 'none', background: '#23263a' }}
        onLoad={() => {
          // Inject a script into the iframe to listen for GET_SELECTED_TEXT and respond with the selection
          const iframe = iframeRef.current;
          if (!iframe) return;
          try {
            const script = document.createElement('script');
            script.textContent = `
              window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'GET_SELECTED_TEXT') {
                  const sel = window.getSelection();
                  event.source.postMessage({ type: 'SELECTED_TEXT', text: sel ? sel.toString() : '' }, '*');
                }
              });
            `;
            iframe.contentDocument?.head.appendChild(script);
          } catch {
            // Ignore if cannot inject (cross-origin)
          }
        }}
      />
      <div style={{ padding: 16, background: '#fff', color: '#222' }}>
        <h4>Extracted Highlights</h4>
        <button onClick={extractSelectedText} style={{ marginBottom: 12, padding: '4px 12px', borderRadius: 4, background: '#23263a', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Extract Selected Text as Highlight
        </button>
        <div style={{ margin: '12px 0' }}>
          <textarea
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder="Paste any text here to add as a highlight"
            rows={3}
            style={{ width: '100%', borderRadius: 4, border: '1px solid #ccc', padding: 8, fontSize: 14 }}
          />
          <button
            onClick={() => {
              if (manualText.trim()) {
                setManualHighlights(prev => [...prev, { text: manualText, color: '#ffe066' }]);
                setManualText('');
              }
            }}
            style={{ marginTop: 4, padding: '4px 12px', borderRadius: 4, background: '#23263a', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Add Pasted Text as Highlight
          </button>
        </div>
        {loading && <div>Extracting highlights...</div>}
        <ul>
          {[...highlights, ...manualHighlights].map((hl, i) => (
            <li key={i} style={{ marginBottom: 8, cursor: 'pointer' }}
                onClick={() => {
                  if (onExtractedHighlights) onExtractedHighlights([hl]);
                }}
                title="Click to render this highlight to the document/text area for chart generation"
            >
              <span style={{ background: hl.color || '#ffe066', color: '#222', borderRadius: 4, padding: '2px 6px', marginRight: 8 }}>{hl.text}</span>
              {hl.color && <span style={{ fontSize: 12, color: hl.color }}>●</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
