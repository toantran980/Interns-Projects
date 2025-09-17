
import './App.css';
import './mermaid-overrides.css';
import FloatingColorPicker from './FloatingColorPicker';
import { useState, useRef, useEffect} from 'react';
import Mermaid from './Mermaid';
import FileUpload from './FileUpload';
import PDFViewer from './PDFViewer';
import useSelection from './hooks/useSelection';
import { getApiBase, postDiagram } from './utils/api';
import { moveCaretToEnd } from './utils/dom';

type DiagramType = 'flowchart' | 'timeline' | 'rules';


/**
 * Main application component definition
 * Handles text input, file upload, text highlighting, diagram generation requests,
 * and rendering the resulting mermaid diagram.
 */
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [text, setText] = useState<string>('');
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const [mermaid, setMermaid] = useState<string>('');
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const instructionTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const selection = useSelection(editableRef);
  const { cachedSelection, showColorPicker, colorPickerPos, applyHighlight, removeHighlights, hasSelectionOrHighlights, closePicker } = selection;

  // Keep contentEditable and text state in sync on mount and when text changes
  useEffect(() => {
    if (editableRef.current && editableRef.current.innerText !== text) {
      editableRef.current.innerText = text;
      if (text) {
        // Move caret to end only if there is text
        moveCaretToEnd(editableRef.current);
      }
    }
  }, [text]);

  // On mount, if there is initial text, set caret to end
  useEffect(() => {
    if (editableRef.current && editableRef.current.innerText) {
      moveCaretToEnd(editableRef.current);
    }
  }, []);

  // Check backend health to see if running in fallback mode (no OPENAI key)
  useEffect(() => {
    const base = getApiBase();
    fetch(`${base.replace(/\/$/, '')}/health`).then(r => r.json()).then((j: unknown) => {
      const obj = j as { fallback?: boolean } | undefined;
      if (obj && obj.fallback) setFallbackMode(true);
    }).catch(() => {
      // ignore errors — keep fallbackMode false
    });
  }, []);

  // Toggle dark mode class on body and update background
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.style.background = 'linear-gradient(120deg, #23283a 0%, #1a1d29 100%)';
      document.body.style.color = '#f7fafc';
    } else {
      document.body.classList.remove('dark-mode');
      document.body.style.background = 'linear-gradient(120deg, #f4f7fa 0%, #e9f0fb 100%)';
      document.body.style.color = '#222';
    }
  }, [darkMode]);

  // Handle file upload and extract text content
  // For PDFs, text extraction is handled in PDFViewer component
  function handleFileLoaded(content: string, file: File) {
    setUploadedFile(file);
    if (file.type === 'application/pdf') {
      return;
    }
    setText(content);
  }

  /**
   * Sends a diagram generation request to the backend for either the full text 
   * or the selected/highlighted text.
   * If no text is available, shows an alert.
   */
  async function requestDiagram(payload: { text: string; diagramType: DiagramType; instruction?: string }, which: 'full' | 'selection') {
    const trimmedText = payload.text?.trim();
    if (!trimmedText) {
      setMermaid('');
      alert('Please enter or select some text to generate a diagram.');
      return;
    }
    if (which === 'full') setLoadingFull(true);
    if (which === 'selection') setLoadingSelection(true);
      try {
      console.log('Sending diagram request:', { ...payload, text: trimmedText });
      const data = await postDiagram({ ...payload, text: trimmedText });
      if (data && data.mermaid && data.mermaid.trim()) {
        setMermaid(data.mermaid);
      } else {
        setMermaid(prev => prev ? prev : '');
      }
    } catch (err) {
      setMermaid(prev => prev ? prev : '');
      console.error('Diagram generation error:', err);
    }
    if (which === 'full') setLoadingFull(false);
    if (which === 'selection') setLoadingSelection(false);
  }

  // Generate diagram for selected/highlighted text
  function generateForSelection() {
    let highlightedText = '';
    if (editableRef.current) {
      // Get all highlighted (colored) text in document order
      const highlights = Array.from(editableRef.current.querySelectorAll('span.highlighted-text'));
      // Sort highlights by their position in the DOM
      highlights.sort((a, b) => {
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        return 0;
      });
      highlightedText = highlights
        .map((el) => (el as HTMLElement).innerText.trim())
        .filter(Boolean)
        .join('\n');
    }
    // Priority: highlighted text > cached selection > full text
    const payload = { text: highlightedText || cachedSelection || text, diagramType, instruction: instructionTextAreaRef.current?.value };
    requestDiagram(payload, 'selection');
  }

  // useSelection exposes hasSelectionOrHighlights

  // selection behavior is handled inside the useSelection hook

  // Apply highlight color to selected text using hook
  function handleColorPick(color: string) {
    applyHighlight(color);
    closePicker();
  }

  return (
  <div className="app"> 
      <button
        className={`mode-toggle-btn${darkMode ? ' dark' : ''}`}
        onClick={() => setDarkMode((d) => !d)}
      >
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      <header style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontWeight: 700,
            letterSpacing: 0.5,
            color: darkMode ? '#fff' : undefined,
            textShadow: darkMode
              ? '0 2px 8px #00cfff88, 0 1px 0 #222'
              : undefined,
          }}
        >
          LLM Powered Chart Maker
        </h1>
        {fallbackMode && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#b45309', fontWeight: 700 }}>
            Fallback mode: using local parser
          </div>
        )}
  <div className="main-subheading">Highlight text, then pick a color to highlight. Click Generate for selection to create a diagram for just that content.</div>
      </header>

      <section className="section-top">
  <label className="small-section">Source Content</label>
        {uploadedFile && uploadedFile.type === 'application/pdf' ? (
          <PDFViewer file={uploadedFile} onExtractedHighlights={highlights => {
            if (highlights && highlights.length > 0) {
              setText(highlights[0].text);
            }
          }} />
        ) : (
          <div style={{ position: 'relative', minHeight: 120, marginBottom: 8 }}>
            <div
              ref={editableRef}
              className="main-textarea editable-textarea"
              contentEditable
              suppressContentEditableWarning
              style={{
                minHeight: 120,
                border: '1px solid #ccc',
                borderRadius: 6,
                padding: 8,
                fontFamily: 'monospace',
                fontSize: 16,
                background: darkMode ? '#23283a' : '#fff',
                color: darkMode ? '#f7fafc' : '#222',
                outline: 'none',
                zIndex: 1,
                textAlign: 'left'
              }}
              onInput={e => {
                setText((e.target as HTMLDivElement).innerText);
              }}
            />
            {!text && (
              <div style={{
                position: 'absolute',
                top: 8,
                left: 12,
                color: '#888',
                pointerEvents: 'none',
                fontFamily: 'monospace',
                fontSize: 16,
                opacity: 0.7,
                zIndex: 2
              }}>
                Paste or type your text here...
              </div>
            )}
          </div>
        )}
        {showColorPicker && !(uploadedFile && uploadedFile.type === 'application/pdf') && (
          <FloatingColorPicker
            position={colorPickerPos}
            onPick={handleColorPick}
            onClose={() => closePicker()}
            showRemove={true}
            onRemove={() => removeHighlights()}
          />
        )}
  <div className="controls">
          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as DiagramType)}
            style={{ marginRight: 20 }}
          >
            <option value="flowchart">Flowchart</option>
            <option value="timeline">Timeline</option>
            <option value="rules">Rules map</option>
          </select>

          <div className="prompt-row">
            <textarea
              ref={instructionTextAreaRef}
              placeholder="Addition Instructions"
              className="instructions-area"
              style={{
                resize: 'none',
                minHeight: 32,
                maxHeight: 80,
                overflow: 'hidden',
                marginRight: 20
              }}
              rows={1}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <div className="button-row">
              <button
                onClick={() => {
                  // Always use the latest value from the editable div
                  const latestText = editableRef.current ? editableRef.current.innerText : text;
                  requestDiagram({ text: latestText, diagramType, instruction: instructionTextAreaRef.current?.value }, 'full');
                }}
                className="secondary"
                disabled={loadingFull}
              >
                {loadingFull ? 'Generating...' : 'Generate from full text'}
              </button>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={generateForSelection}
                className="primary-action"
                disabled={loadingSelection || !hasSelectionOrHighlights}
                title={!hasSelectionOrHighlights ? 'Select or highlight text first' : 'Generate diagram for selection'}
                aria-disabled={!hasSelectionOrHighlights || loadingSelection}
              >
                {loadingSelection ? 'Generating...' : 'Generate for selection'}
              </button>
              <FileUpload onFileLoaded={handleFileLoaded} />
            </div>
        </div>
      </div>
      </section>

      <section className="section-result">
        {mermaid ? (
          <Mermaid chart={extractMermaidCode(mermaid)} />
        ) : null}
      </section>
    </div>
  );
}

/**
 * Extracts mermaid code from a fenced code block, or returns the input trimmed.
 */
function extractMermaidCode(block: string): string {
  const match = block.match(/```mermaid\s*([\s\S]*?)```/);
  return match ? match[1].trim() : block.trim();
}
