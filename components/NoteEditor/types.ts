import { Note, AITextAction } from "../../types";

export interface NoteEditorProps {
  activeNote: Note | undefined;
  onUpdateNote: (note: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: (note: Note) => void;
  viewMode?: "split" | "editor" | "preview";
  onRestoreVersion?: (restoredNote: Note) => void;
}

export interface EditorPaneProps {
  activeNote: Note;
  currentEditorContent: string;
  setCurrentEditorContent: (content: string) => void;
  onUpdateNote: (note: Partial<Note>) => void;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  contextualMenu: ContextualMenuState | null;
  onTextSelection: (e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onAiTextAction: (action: AITextAction, language?: string) => Promise<void>;
  isAiActionLoading: boolean;
  isGeneratingTitle: boolean;
  onGenerateTitle: () => Promise<void>;
  suggestionsEnabled: boolean;
  setSuggestionsEnabled: (enabled: boolean) => void;
  onGenerateClick: () => void;
  pushToUndoStack: (content: string) => void;
  // Version control props
  onOpenVersionHistory?: () => void;
  onCreateVersion?: () => void;
  hasUnsavedChanges?: boolean;
  versionCount?: number;
}

export interface PreviewPaneProps {
  activeNote: Note;
  renderedMarkdown: string;
  mermaidDiagrams: MermaidDiagram[];
  previewRef: React.RefObject<HTMLDivElement>;
  selectionNavigator: SelectionNavigatorState | null;
  navigateMatches: (direction: "next" | "prev") => void;
  setSelectionNavigator: (state: SelectionNavigatorState | null) => void;
  onPreviewSelection: (e: React.MouseEvent<HTMLDivElement>) => void;
  suggestedTags: string[];
  addSuggestedTag: (tag: string) => void;
  isSuggestingTags: boolean;
  onSuggestTags: () => Promise<void>;
  isSummarizing: boolean;
  onSummarize: () => Promise<void>;
  onShare: () => void;
  onDownload: () => void;
  onCopyAll: () => void;
  onDelete: () => void;
}

export interface ContextualMenuState {
  top: number;
  left: number;
}

export interface SelectionNavigatorState {
  top: number;
  left: number;
  matches: { start: number; end: number }[];
  currentIndex: number;
}

export interface UndoRedoState {
  content: string;
  cursorPos: number;
}

export interface UseUndoRedoReturn {
  undoStack: UndoRedoState[];
  redoStack: UndoRedoState[];
  pushToUndoStack: (content: string) => void;
  undo: () => void;
  redo: () => void;
  clearStacks: () => void;
}

export interface UseModalStatesReturn {
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  isAIGenerateModalOpen: boolean;
  setIsAIGenerateModalOpen: (open: boolean) => void;
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (open: boolean) => void;
  isSummaryModalOpen: boolean;
  setIsSummaryModalOpen: (open: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  isAIModifyModalOpen: boolean;
  setIsAIModifyModalOpen: (open: boolean) => void;
}

export interface UseContextualMenuReturn {
  contextualMenu: ContextualMenuState | null;
  setContextualMenu: (state: ContextualMenuState | null) => void;
  handleTextSelection: (
    e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>,
    editorRef: React.RefObject<HTMLTextAreaElement>,
    editorContainerRef: React.RefObject<HTMLDivElement>,
    isDesktop: boolean
  ) => void;
}

export interface UseSelectionNavigatorReturn {
  selectionNavigator: SelectionNavigatorState | null;
  setSelectionNavigator: (state: SelectionNavigatorState | null) => void;
  handlePreviewSelection: (
    e: React.MouseEvent<HTMLDivElement>,
    activeNote: Note,
    editorRef: React.RefObject<HTMLTextAreaElement>
  ) => void;
  navigateMatches: (direction: "next" | "prev") => void;
}

export interface MermaidDiagram {
  id: string;
  code: string;
  placeholder: string;
}

export interface UseMarkdownProcessingReturn {
  renderedMarkdown: string;
  mermaidDiagrams: MermaidDiagram[];
  processPreviewContent: () => void;
  restoreCopyButtons: () => void;
}

export interface TagProps {
  tag: string;
  onRemove: (tag: string) => void;
}

export interface LoadingSpinnerProps {}

export interface ScrollSyncOptions {
  editorRef: React.RefObject<HTMLTextAreaElement>;
  previewRef: React.RefObject<HTMLDivElement>;
  viewMode: string;
  activeNoteId: string | undefined;
  currentEditorContent: string;
  renderedMarkdown: string;
}
