
import React, { useState, useMemo, useCallback, useRef, KeyboardEvent, useEffect } from 'react';
import { Note, AITextAction } from '../types';
import { summarizeText, suggestTagsForText, generateNoteContent, performTextAction } from '../services/geminiService';
import { getWordMeaning } from '../services/dictionaryService';
import { useToasts } from '../hooks/useToasts';
import { useMediaQuery } from '../hooks/useMediaQuery';

import SparklesIcon from './icons/SparklesIcon';
import TrashIcon from './icons/TrashIcon';
import LogoIcon from './icons/LogoIcon';
import ConfirmationModal from './ConfirmationModal';
import AIGenerateModal from './AIGenerateModal';
import XIcon from './icons/XIcon';
import EditorToolbar from './EditorToolbar';
import SplitPane from './SplitPane';
import EditIcon from './icons/EditIcon';
import ViewIcon from './icons/ViewIcon';
import TagIcon from './icons/TagIcon';
import ContextualMenu from './ContextualMenu';

declare const marked: any;
declare const hljs: any;

interface NoteEditorProps {
  activeNote: Note | undefined;
  onUpdateNote: (note: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="w-5 h-5 border-2 border-text-muted/50 border-t-accent dark:border-dark-text-muted/50 dark:border-t-dark-accent rounded-full animate-spin"></div>
);

const Tag: React.FC<{ tag: string; onRemove: (tag: string) => void }> = ({ tag, onRemove }) => (
  <div className="flex items-center bg-accent/20 text-accent dark:bg-dark-accent/20 dark:text-dark-accent-hover text-sm font-medium pl-3 pr-2 py-1 rounded-full animate-fade-in">
    <span>{tag}</span>
    <button onClick={() => onRemove(tag)} className="ml-1.5 p-0.5 rounded-full hover:bg-accent/30 dark:hover:bg-dark-accent/30">
        <XIcon className="w-3 h-3"/>
    </button>
  </div>
);

const NoteEditor: React.FC<NoteEditorProps> = ({ activeNote, onUpdateNote, onDeleteNote }) => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [contextualMenu, setContextualMenu] = useState<{ top: number; left: number } | null>(null);
  const [isAiActionLoading, setIsAiActionLoading] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  
  const { addToast } = useToasts();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Marked and Highlight.js here, in the component that uses them.
    if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
      marked.setOptions({
        highlight: function (code: string, lang: string) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language, ignoreIllegals: true }).value;
        },
        langPrefix: 'hljs language-',
        gfm: true,
        breaks: true,
      });
    }
  }, []);

  const renderedMarkdown = useMemo(() => {
    if (activeNote && typeof marked !== 'undefined') {
      const dirty = marked.parse(activeNote.content);
      return dirty;
    }
    return '';
  }, [activeNote]);

  useEffect(() => {
    // Re-run syntax highlighting when the note changes, and ensure hljs is loaded.
    if (activeNote && typeof hljs !== 'undefined') {
        setTimeout(() => {
            // Check again inside timeout in case component unmounted
            if (typeof hljs !== 'undefined') {
                hljs.highlightAll();
            }
        }, 0);
    }
  }, [renderedMarkdown, activeNote]);

  // Bug fix: Close contextual menu on any click outside of it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the menu container
      const menu = document.querySelector('.contextual-menu-container');
      if (menu && !menu.contains(event.target as Node)) {
        setContextualMenu(null);
      }
    };
    
    const handleKeyDown = (event: any) => {
      if (event.key === 'Escape') {
        setContextualMenu(null);
      }
    };
    
    if (contextualMenu) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextualMenu]);




  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({ title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNote({ content: e.target.value });
    // Hide menu when user starts typing
    if (contextualMenu) setContextualMenu(null);
  };
  
  const handleTagInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const newTag = e.currentTarget.value.trim().toLowerCase();
        if (newTag && !activeNote?.tags.includes(newTag)) {
            onUpdateNote({ tags: [...(activeNote?.tags || []), newTag] });
            e.currentTarget.value = '';
        }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateNote({ tags: activeNote?.tags.filter(t => t !== tagToRemove) });
  };

  const addSuggestedTag = (tagToAdd: string) => {
      if (tagToAdd && !activeNote?.tags.includes(tagToAdd)) {
          onUpdateNote({ tags: [...(activeNote?.tags || []), tagToAdd] });
          setSuggestedTags(prev => prev.filter(t => t !== tagToAdd));
      }
  };

  const handleSummarize = useCallback(async () => {
    if (!activeNote) return;
    setIsSummarizing(true);
    addToast('Generating summary...', 'info');
    try {
      const summary = await summarizeText(activeNote.content);
      const summaryContent = `\n\n---\n\n**AI Summary:**\n*${summary}*`;
      onUpdateNote({ content: activeNote.content + summaryContent });
      addToast('Summary added to note!', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to get summary.', 'error');
    } finally {
      setIsSummarizing(false);
    }
  }, [activeNote, onUpdateNote, addToast]);

  const handleSuggestTags = useCallback(async () => {
    if (!activeNote) return;
    setIsSuggestingTags(true);
    try {
      const tags = await suggestTagsForText(activeNote.content);
      setSuggestedTags(tags.filter(t => !activeNote.tags.includes(t)));
    } catch (error) {
       addToast(error instanceof Error ? error.message : 'Failed to suggest tags.', 'error');
    } finally {
      setIsSuggestingTags(false);
    }
  }, [activeNote, addToast]);
  
  const handleGenerateNote = async ({ topic, language }: { topic: string, language: string }) => {
    setIsGeneratingNote(true);
    try {
        const content = await generateNoteContent(topic, language);
        onUpdateNote({ title: topic, content: content });
        addToast('Note generated successfully!', 'success');
        setIsAIGenerateModalOpen(false);
    } catch (error) {
        addToast(error instanceof Error ? error.message : 'Failed to generate note.', 'error');
    } finally {
        setIsGeneratingNote(false);
    }
  };
  
  const handleTextSelection = (e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    // Use a longer timeout to allow the browser to update selection state
    setTimeout(() => {
        try {
            // Force refresh the selection state
            const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
            
            if (selectedText.length > 0) {
                const containerRect = editorContainerRef.current?.getBoundingClientRect();
                if (containerRect && editorContainerRef.current) {
                    // Get position from either mouse or touch event
                    let clientX: number, clientY: number;
                    
                    if ('clientX' in e) {
                        // Mouse event
                        clientX = e.clientX;
                        clientY = e.clientY;
                    } else {
                        // Touch event - use the first touch point
                        const touch = e.changedTouches[0] || e.touches[0];
                        clientX = touch.clientX;
                        clientY = touch.clientY;
                    }
                    
                    // Position menu above the cursor/touch, relative to its container.
                    let top = clientY - containerRect.top - 55; // 55px offset for menu height + spacing
                    let left = clientX - containerRect.left;
                    
                    // Ensure the menu doesn't go too far left (behind sidebar) or right
                    const menuWidth = 280; // Approximate width of contextual menu (increased for mobile)
                    const minLeft = 10; // Minimum distance from left edge
                    const maxLeft = containerRect.width - menuWidth - 10; // Maximum distance from right edge
                    
                    left = Math.max(minLeft, Math.min(left, maxLeft));
                    
                    // Ensure the menu doesn't go above the container
                    top = Math.max(10, top);
                    
                    setContextualMenu({ top, left });
                    // Add class to body to suppress default selection behavior
                    document.body.classList.add('contextual-menu-active');
                }
            } else {
                 // Clicks/touches inside the textarea without selection should hide the menu.
                 setContextualMenu(null);
                 document.body.classList.remove('contextual-menu-active');
            }
        } catch (error) {
            // If any error occurs, clear the menu
            setContextualMenu(null);
            document.body.classList.remove('contextual-menu-active');
        }
    }, 150); // Slightly longer timeout for touch events
  };



  const handleAiTextAction = async (action: AITextAction, language?: string) => {
    const textarea = editorRef.current;
    if (!textarea || !activeNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) return;

    setIsAiActionLoading(true);
    try {
        if (action === 'dictionary') {
            const meaning = await getWordMeaning(selectedText, language || 'en');
            addToast(`"${selectedText}" → ${meaning}`, 'info');
        } else {
            const modifiedText = await performTextAction(selectedText, action, language);
            const newContent = `${activeNote.content.substring(0, start)}${modifiedText}${activeNote.content.substring(end)}`;
            onUpdateNote({ content: newContent });
            
            const editorWrapper = document.querySelector('.editor-textarea-wrapper');
            if (editorWrapper) {
                editorWrapper.classList.add('flash-glow');
                setTimeout(() => editorWrapper.classList.remove('flash-glow'), 600);
            }

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start, start + modifiedText.length);
            }, 0);
        }

    } catch (error) {
        addToast(error instanceof Error ? error.message : `AI action failed.`, 'error');
    } finally {
        setIsAiActionLoading(false);
        setContextualMenu(null);
    }
  };




  if (!activeNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-text-muted dark:text-dark-text-muted bg-bg-primary dark:bg-dark-bg-primary">
        <LogoIcon className="w-24 h-24 mb-4 text-accent/50 dark:text-dark-accent/50 opacity-50" />
        <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Select a note to get started</h2>
        <p className="mt-2 text-lg">Or create a new one to capture your ideas!</p>
      </div>
    );
  }

  const editorPane = (
      <div className="flex flex-col h-full bg-surface dark:bg-dark-surface relative" ref={editorContainerRef}>
          <div className="p-4 border-b border-border-color dark:border-dark-border-color">
              <input
                  type="text"
                  value={activeNote.title}
                  onChange={handleTitleChange}
                  className="w-full text-2xl font-bold bg-transparent text-text-primary dark:text-dark-text-primary focus:outline-none placeholder:text-text-muted"
                  placeholder="Untitled Note"
              />
              <div className="flex items-center flex-wrap gap-2 mt-3">
                  {activeNote.tags.map(tag => <Tag key={tag} tag={tag} onRemove={removeTag} />)}
                  <input 
                      type="text"
                      onKeyDown={handleTagInput}
                      placeholder="Add a tag..."
                      className="bg-transparent text-sm focus:outline-none text-text-muted dark:text-dark-text-muted"
                  />
              </div>
          </div>
          <EditorToolbar textareaRef={editorRef as React.RefObject<HTMLTextAreaElement>} onUpdate={(v) => onUpdateNote({ content: v })} onGenerateClick={() => setIsAIGenerateModalOpen(true)} />
          <div className="flex-grow overflow-y-auto p-4 editor-textarea-wrapper">
              <textarea
                  ref={editorRef}
                  value={activeNote.content}
                  onChange={handleContentChange}
                  onMouseUp={handleTextSelection}
                  onTouchEnd={handleTextSelection}
                  onContextMenu={(e) => {
                    // Prevent default browser context menu on text selection
                    e.preventDefault();
                  }}
                  onMouseDown={(e) => {
                    // Don't clear menu if clicking on the contextual menu
                    if (!(e.target as HTMLElement).closest('.contextual-menu-container')) {
                      setContextualMenu(null);
                      document.body.classList.remove('contextual-menu-active');
                    }
                  }}
                  onTouchStart={(e) => {
                    // Don't clear menu if touching the contextual menu
                    if (!(e.target as HTMLElement).closest('.contextual-menu-container')) {
                      setContextualMenu(null);
                      document.body.classList.remove('contextual-menu-active');
                    }
                  }}

                  style={{
                    WebkitUserSelect: 'text',
                    WebkitTouchCallout: 'none', // Disable iOS callout menu
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  className="w-full h-full bg-transparent text-text-secondary dark:text-dark-text-secondary focus:outline-none resize-none leading-relaxed font-mono editor-textarea"
                  placeholder="Start writing..."
              />
          </div>
          <footer className="flex-shrink-0 p-2 border-t border-border-color dark:border-dark-border-color text-xs text-text-muted dark:text-dark-text-muted flex items-center justify-between">
              <span>{activeNote.content.split(/\s+/).filter(Boolean).length} words</span>
              <span>Last updated: {new Date(activeNote.updatedAt).toLocaleString()}</span>
          </footer>
          {contextualMenu && (
              <ContextualMenu 
                  top={contextualMenu.top} 
                  left={contextualMenu.left} 
                  onAction={handleAiTextAction}
                  isLoading={isAiActionLoading}
                  selectedText={editorRef.current?.value.substring(
                    editorRef.current?.selectionStart || 0,
                    editorRef.current?.selectionEnd || 0
                  )}
              />
          )}
      </div>
  );
  
  const previewPane = (
      <div className="flex flex-col h-full bg-bg-primary dark:bg-dark-bg-primary relative">
          <div 
            className="prose prose-sm md:prose-base dark:prose-invert max-w-none flex-grow overflow-y-auto p-6 select-text preview-pane" 
            dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
            style={{ userSelect: 'text', cursor: 'text' }}
          />

          <div className="flex-shrink-0 p-2 sm:p-3 border-t border-border-color dark:border-dark-border-color">
            {suggestedTags.length > 0 && (
                <div className="mb-3">
                    <div className="text-xs sm:text-sm font-semibold text-text-muted dark:text-dark-text-muted mb-2">
                        Suggestions:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {suggestedTags.map(tag => (
                            <button key={tag} onClick={() => addSuggestedTag(tag)} className="text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-full bg-accent/10 text-accent dark:bg-dark-accent/20 dark:text-dark-accent-hover hover:bg-accent/20 dark:hover:bg-dark-accent/30 transition-colors whitespace-nowrap">
                                + {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex justify-end items-center gap-2">
              <button onClick={handleSuggestTags} disabled={isSuggestingTags} className="flex items-center gap-1.5 px-3 py-2 bg-bg-secondary dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-border-color dark:hover:bg-dark-border-color transition-colors disabled:opacity-50">
                  {isSuggestingTags ? <LoadingSpinner/> : <TagIcon className="w-4 h-4 text-accent dark:text-dark-accent" />}
                  <span className="hidden sm:inline">Suggest Tags</span>
                  <span className="sm:hidden">Tags</span>
              </button>
              <button onClick={handleSummarize} disabled={isSummarizing} className="flex items-center gap-1.5 px-3 py-2 bg-bg-secondary dark:bg-dark-bg-secondary text-sm font-semibold rounded-md hover:bg-border-color dark:hover:bg-dark-border-color transition-colors disabled:opacity-50">
                  {isSummarizing ? <LoadingSpinner/> : <SparklesIcon className="w-4 h-4 text-accent dark:text-dark-accent" />}
                  <span className="hidden md:inline">Summarize</span>
                  <span className="md:hidden">Summary</span>
              </button>
               <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 rounded-md hover:bg-red-500/10 text-red-500 transition-colors">
                  <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
      </div>
  );


  return (
    <>
      <div className="w-full h-full bg-bg-primary dark:bg-dark-bg-primary">
          {isDesktop ? (
              <SplitPane left={editorPane} right={previewPane} />
          ) : (
              <div className="h-full flex flex-col">
                  <div className="flex-shrink-0 flex p-1 bg-bg-secondary dark:bg-dark-bg-secondary border-b border-border-color dark:border-dark-border-color">
                      <button onClick={() => setMobileView('editor')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${mobileView === 'editor' ? 'bg-surface dark:bg-dark-surface text-accent dark:text-dark-accent' : 'text-text-muted dark:text-dark-text-muted'}`}><EditIcon className="w-5 h-5 mx-auto"/></button>
                      <button onClick={() => setMobileView('preview')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${mobileView === 'preview' ? 'bg-surface dark:bg-dark-surface text-accent dark:text-dark-accent' : 'text-text-muted dark:text-dark-text-muted'}`}><ViewIcon className="w-5 h-5 mx-auto"/></button>
                  </div>
                  <div className="flex-grow overflow-hidden">
                    {mobileView === 'editor' ? editorPane : previewPane}
                  </div>
              </div>
          )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDeleteNote(activeNote.id);
          setIsDeleteModalOpen(false);
        }}
        title="Delete Note"
        message={<>Are you sure you want to delete "<strong>{activeNote.title}</strong>"? This action cannot be undone.</>}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <AIGenerateModal
        isOpen={isAIGenerateModalOpen}
        isGenerating={isGeneratingNote}
        onClose={() => setIsAIGenerateModalOpen(false)}
        onGenerate={handleGenerateNote}
      />
    </>
  );
};

export default NoteEditor;