
const COLORS = [
  { value: '#fff59d' },
  { value: '#b9f6ca' },
  { value: '#b3e5fc' },
  { value: '#f8bbd0' },
  { value: '#ffe0b2' },
];

interface FloatingColorPickerProps {
  position: { top: number; left: number };
  onPick: (color: string) => void;
  onClose?: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
}

const FloatingColorPicker: React.FC<FloatingColorPickerProps> = ({ position, onPick, showRemove, onRemove }) => {
  // Detect dark mode
  const isDark = typeof document !== 'undefined' && document.body.classList.contains('dark-mode');
  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        background: isDark ? '#23283a' : '#fff',
        border: isDark ? '1.5px solid #7ecfff' : '1px solid #ccc',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        padding: 8,
        zIndex: 1000,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
      }}
    >
      {COLORS.map((c) => (
        <button
          key={c.value}
          onClick={() => onPick(c.value)}
          style={{
            background: c.value,
            border: isDark ? '1.5px solid #7ecfff' : '1.5px solid #0078d4',
            borderRadius: '50%',
            width: 18,
            height: 18,
            minWidth: 18,
            minHeight: 18,
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            outline: 'none',
            display: 'inline-block',
          }}
          aria-label={c.value}
        />
      ))}
      {showRemove && (
        <button
          onClick={onRemove}
          style={{
            background: isDark ? '#23283a' : '#fff',
            color: isDark ? '#7ecfff' : '#0078d4',
            border: isDark ? '1.5px solid #7ecfff' : '1.5px solid #0078d4',
            borderRadius: 4,
            padding: '2px 10px',
            marginLeft: 8,
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            outline: 'none',
            transition: 'background 0.2s, color 0.2s, border 0.2s',
          }}
        >Remove</button>
      )}
    </div>
  );
};

export default FloatingColorPicker;
