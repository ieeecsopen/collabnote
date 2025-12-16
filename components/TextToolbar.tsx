import React, { useEffect, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Link } from 'lucide-react';

const TextToolbar: React.FC = () => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [formats, setFormats] = useState({ 
    bold: false, 
    italic: false, 
    underline: false, 
    strikethrough: false 
  });

  const updateFormats = () => {
    setFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
    });
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Only show if selection is non-empty and visible
      if (rect.width > 0) {
        setPosition({
          top: rect.top - 50, // Fixed position relative to viewport
          left: rect.left + rect.width / 2
        });
        updateFormats();
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const format = (command: string) => {
    document.execCommand(command, false);
    updateFormats();
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  };

  if (!position) return null;

  return (
    <div 
      className="fixed z-50 flex items-center gap-1 p-1 bg-gray-900 text-white rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200"
      style={{ 
        top: position.top, 
        left: position.left,
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent losing focus when clicking buttons
    >
      <button 
        onClick={() => format('bold')}
        className={`p-1.5 rounded transition-colors ${formats.bold ? 'bg-gray-700 text-indigo-300' : 'hover:bg-gray-700'}`}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </button>
      <button 
        onClick={() => format('italic')}
        className={`p-1.5 rounded transition-colors ${formats.italic ? 'bg-gray-700 text-indigo-300' : 'hover:bg-gray-700'}`}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </button>
      <button 
        onClick={() => format('underline')}
        className={`p-1.5 rounded transition-colors ${formats.underline ? 'bg-gray-700 text-indigo-300' : 'hover:bg-gray-700'}`}
        title="Underline (Ctrl+U)"
      >
        <Underline size={16} />
      </button>
      <button 
        onClick={() => format('strikeThrough')}
        className={`p-1.5 rounded transition-colors ${formats.strikethrough ? 'bg-gray-700 text-indigo-300' : 'hover:bg-gray-700'}`}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <button 
        onClick={insertLink}
        className="p-1.5 rounded transition-colors hover:bg-gray-700"
        title="Link"
      >
        <Link size={16} />
      </button>
      
      <div className="w-px h-4 bg-gray-700 mx-1"></div>
      
      <div className="px-2 text-xs text-gray-400 font-medium">
          Edit
      </div>
    </div>
  );
};

export default TextToolbar;