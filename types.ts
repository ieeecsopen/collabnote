export type BlockType =
  | 'paragraph'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'bullet-list'
  | 'number-list'
  | 'quote'
  | 'code'
  | 'divider'
  | 'todo'
  | 'callout'
  | 'table'
  | 'image'
  | 'toggle';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: Record<string, any>;
}

export interface Document {
  id: string;
  title: string;
  icon: string;
  blocks: Block[];
  lastEdited: Date;
}

export interface Folder {
  id: string;
  name: string;
  documents: Document[];
  isOpen: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  folders: Folder[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isActive: boolean;
}

export type AIRequestType = 'continue' | 'summarize' | 'fix-grammar' | 'translate' | 'brainstorm' | 'format';