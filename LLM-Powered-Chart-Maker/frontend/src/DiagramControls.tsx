import React from 'react';
import type { RefObject } from 'react';

type DiagramType = 'flowchart' | 'timeline' | 'rules';

interface DiagramControlsProps {
  diagramType: DiagramType;
  setDiagramType: (t: DiagramType) => void;
  instructionTextAreaRef: RefObject<HTMLTextAreaElement>;
  loadingFull: boolean;
  loadingSelection: boolean;
  onGenerateFull: () => void;
  onGenerateSelection: () => void;
}

const DiagramControls: React.FC<DiagramControlsProps> = ({
  diagramType,
  setDiagramType,
  instructionTextAreaRef,
  loadingFull,
  loadingSelection,
  onGenerateFull,
  onGenerateSelection
}) => (
  <div className="controls">
    <select
      value={diagramType}
      onChange={e => setDiagramType(e.target.value as DiagramType)}
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
        className="instruction-input dynamic-instruction"
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
      <button
        onClick={onGenerateFull}
        className="secondary"
        disabled={loadingFull}
        style={{ marginRight: 20 }}
      >
        {loadingFull ? 'Generating...' : 'Generate from full text'}
      </button>
      <button
        onMouseDown={e => e.preventDefault()}
        onClick={onGenerateSelection}
        className="primary-action"
        disabled={loadingSelection}
      >
        {loadingSelection ? 'Generating...' : 'Generate for selection'}
      </button>
    </div>
  </div>
);

export default DiagramControls;
