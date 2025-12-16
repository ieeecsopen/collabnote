import React, { useRef, useEffect, useState } from 'react';
import { Block, BlockType } from '../types';
import { GripVertical, Type, List, ListOrdered, Quote, Code, Minus, MessageSquarePlus, Wand2, Loader } from 'lucide-react';
import { generateAIContent } from '../services/geminiService';

interface BlockComponentProps {
  block: Block;
  isFocused: boolean;
  updateBlock: (id: string, content: string) => void;
  addBlock: (afterId: string, type?: BlockType) => void;
  removeBlock: (id: string) => void;
  focusBlock: (id: string, offset?: number) => void;
  changeBlockType: (id: string, type: BlockType) => void;
  onEnter: (id: string) => void;
  onArrowUp: (id: string) => void;
  onArrowDown: (id: string) => void;
  showAI: (blockId: string) => void;
}

const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  isFocused,
  updateBlock,
  addBlock,
  removeBlock,
  focusBlock,
  changeBlockType,
  onEnter,
  onArrowUp,
  onArrowDown,
  showAI
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isFocused]);

  useEffect(() => {
      if (contentRef.current && contentRef.current.innerHTML !== block.content) {
          if (document.activeElement !== contentRef.current) {
              contentRef.current.innerHTML = block.content;
          }
      }
  }, [block.content]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const newContent = e.currentTarget.innerHTML;
      updateBlock(block.id, newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter(block.id);
    } else if (e.key === 'Backspace' && !contentRef.current?.textContent) {
      e.preventDefault();
      removeBlock(block.id);
    } else if (e.key === 'ArrowUp') {
        const selection = window.getSelection();
        if (selection && selection.anchorOffset === 0 && selection.isCollapsed) {
             e.preventDefault();
             onArrowUp(block.id);
        }
    } else if (e.key === 'ArrowDown') {
        const selection = window.getSelection();
        const textLength = contentRef.current?.textContent?.length || 0;
        if (selection && selection.anchorOffset >= textLength && selection.isCollapsed) {
            e.preventDefault();
            onArrowDown(block.id);
        }
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading-1': return 'Heading 1';
      case 'heading-2': return 'Heading 2';
      case 'heading-3': return 'Heading 3';
      case 'code': return 'Type code...';
      case 'quote': return 'Empty quote';
      default: return "Type '/' for commands";
    }
  };

  const getStyles = () => {
    switch (block.type) {
      case 'heading-1': return 'text-4xl font-bold mt-6 mb-2 text-slate-900 tracking-tight';
      case 'heading-2': return 'text-2xl font-semibold mt-5 mb-2 text-slate-800 tracking-tight';
      case 'heading-3': return 'text-xl font-semibold mt-3 mb-1 text-slate-800 tracking-tight';
      case 'bullet-list': return 'list-disc ml-4';
      case 'number-list': return 'list-decimal ml-4';
      case 'quote': return 'border-l-4 border-slate-300 pl-4 py-1 italic text-slate-600';
      case 'code': return 'font-mono text-sm bg-slate-100 p-3 rounded-md text-slate-800 border border-slate-200';
      case 'divider': return 'border-b border-slate-200 my-4 h-0';
      default: return 'text-base text-slate-700 min-h-[1.5em] leading-7';
    }
  };

  const TypeIcon = () => {
      switch(block.type) {
          case 'heading-1': return <Type size={14} className="font-bold" />;
          case 'heading-2': return <Type size={14} />;
          case 'bullet-list': return <List size={14} />;
          case 'number-list': return <ListOrdered size={14} />;
          case 'code': return <Code size={14} />;
          case 'quote': return <Quote size={14} />;
          case 'divider': return <Minus size={14} />;
          default: return <Type size={14} className="opacity-50" />;
      }
  }

  if (block.type === 'divider') {
    return (
      <div 
        className="group relative flex items-center -ml-8 pl-8 py-1"
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
        onClick={() => focusBlock(block.id)}
      >
         <div className={`absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-200 ${showMenu || isFocused ? 'opacity-100' : 'opacity-0'}`}>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-400 cursor-grab active:cursor-grabbing">
                <GripVertical size={16} />
            </button>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-400" onClick={() => removeBlock(block.id)}>
                <Minus size={16} />
            </button>
        </div>
        <hr className="w-full border-slate-200" />
      </div>
    )
  }

  return (
    <div 
      className="group relative flex items-start -ml-12 pl-12 py-1 transition-colors"
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Block Handle / Menu */}
      <div className={`absolute left-0 top-1.5 flex items-center gap-0.5 transition-opacity duration-200 ${showMenu || isFocused || aiMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
        <button 
            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to move"
        >
            <GripVertical size={18} />
        </button>
        
        {/* Type Switcher Quick Menu */}
        <div className="relative group/menu">
             <button className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                <TypeIcon />
            </button>
            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-md z-50 hidden group-hover/menu:block p-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">Turn into</div>
                {[
                    { id: 'paragraph', label: 'Text', icon: Type },
                    { id: 'heading-1', label: 'Heading 1', icon: Type },
                    { id: 'heading-2', label: 'Heading 2', icon: Type },
                    { id: 'bullet-list', label: 'Bulleted List', icon: List },
                    { id: 'number-list', label: 'Numbered List', icon: ListOrdered },
                    { id: 'code', label: 'Code Block', icon: Code },
                    { id: 'quote', label: 'Quote', icon: Quote },
                ].map((type) => (
                    <button 
                        key={type.id}
                        onClick={() => changeBlockType(block.id, type.id as BlockType)}
                        className={`flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 transition-colors ${block.type === type.id ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700'}`}
                    >
                        <type.icon size={14} />
                        {type.label}
                    </button>
                ))}
            </div>
        </div>

        {/* AI Menu */}
        <div className="relative">
            <button 
                onClick={(e) => { e.stopPropagation(); setAiMenuOpen(!aiMenuOpen); }}
                className={`p-1 hover:bg-purple-50 rounded-md text-purple-500 transition-colors ${aiMenuOpen ? 'bg-purple-50' : ''}`}
                title="AI Options"
            >
                    <MessageSquarePlus size={16} />
            </button>
            {aiMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setAiMenuOpen(false)}></div>
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 shadow-lg rounded-md z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => { setAiMenuOpen(false); showAI(block.id); }}
                            className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 text-slate-700 transition-colors"
                        >
                            <MessageSquarePlus size={14} className="text-purple-500" />
                            <span>Ask Gemini...</span>
                        </button>
                        <button
                            onClick={async () => {
                                if (block.content.trim().length === 0) return;
                                setIsFormatting(true);
                                const formatted = await generateAIContent('', block.content, 'format');
                                updateBlock(block.id, formatted);
                                setIsFormatting(false);
                                setAiMenuOpen(false);
                            }}
                            disabled={isFormatting}
                            className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-slate-100 text-slate-700 disabled:opacity-50 transition-colors"
                        >
                            {isFormatting ? <Loader size={14} className="animate-spin" /> : <Wand2 size={14} className="text-blue-500" />}
                            <span>Smart Format</span>
                        </button>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Editor Content */}
      <div className={`flex-1 relative ${block.type === 'bullet-list' || block.type === 'number-list' ? 'flex gap-2' : ''}`}>
        
        {block.type === 'bullet-list' && <span className="text-slate-900 font-bold select-none leading-7">•</span>}
        {block.type === 'number-list' && <span className="text-slate-900 font-medium select-none leading-7">1.</span>}

        <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onClick={() => focusBlock(block.id)}
            data-placeholder={getPlaceholder()}
            className={`w-full outline-none placeholder-empty ${getStyles()}`}
            spellCheck={false}
            dangerouslySetInnerHTML={{ __html: block.content }}
        />
      </div>
    </div>
  );
};

export default BlockComponent;