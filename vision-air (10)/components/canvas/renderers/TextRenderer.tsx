
import React, { useRef, useEffect } from 'react';
import { SlideElement } from '../../../types';

interface TextRendererProps {
  element: SlideElement;
  isEditing: boolean;
  onUpdate: (id: string, content: string) => void;
  style: React.CSSProperties;
}

export const TextRenderer: React.FC<TextRendererProps> = ({ element, isEditing, onUpdate, style }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync state to DOM only when NOT editing or when initial load
  useEffect(() => {
    if (editorRef.current && !isEditing) {
      if (editorRef.current.innerHTML !== (element.content || '')) {
          editorRef.current.innerHTML = element.content || '';
      }
    }
  }, [element.content, isEditing]);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
      // Place cursor at end
      try {
          const range = document.createRange();
          const sel = window.getSelection();
          if (sel) {
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
      } catch(e) {}
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (html !== element.content) {
          onUpdate(element.id, html);
      }
    }
  };

  const handleInput = () => {
    // Optional: Real-time update if needed, but blur is safer for undo history
  };

  const containerStyle: React.CSSProperties = {
    ...style,
    outline: 'none',
    cursor: isEditing ? 'text' : 'default', 
    userSelect: isEditing ? 'text' : 'none',
    minHeight: '1em',
    wordBreak: 'break-word',
    whiteSpace: 'normal', 
    lineHeight: style.lineHeight || '1.2',
    backgroundColor: 'transparent',
    padding: '0px',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  };

  return (
    <div
      ref={editorRef}
      style={containerStyle}
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') {
              editorRef.current?.blur();
          }
      }}
      onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
    />
  );
};
