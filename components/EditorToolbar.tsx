import React, { useState } from 'react';
import { FaBold, FaItalic, FaUnderline, FaLink, FaCode, FaListUl, FaStrikethrough, FaQuoteRight, FaListCheck, FaMinus, FaEllipsis, FaWandMagicSparkles, FaHeading } from 'react-icons/fa6';
import { FaRegStar } from 'react-icons/fa';
import ConfirmationModal from './ConfirmationModal';
import { performTextAction } from '../services/geminiService';
import { AITextAction } from '../types';


interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onUpdate: (value: string) => void;
  onGenerateClick: () => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; title: string; disabled?: boolean; className?: string }> = ({ onClick, children, title, disabled, className }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors disabled:opacity-50 ${className || ''}`}
    disabled={disabled}
  >
    {children}
  </button>
);

const EditorToolbar: React.FC<EditorToolbarProps> = ({ textareaRef, onUpdate, onGenerateClick }) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [beautifiedText, setBeautifiedText] = useState('');
  const [showAllTools, setShowAllTools] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
  
  const applyFormat = (syntax: 'bold' | 'italic' | 'underline' | 'code' | 'link' | 'list' | 'h1' | 'h2' | 'h3' | 'strikethrough' | 'quote' | 'tasklist' | 'hr') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let newText;
    let cursorOffset = 0;

    switch (syntax) {
      case 'bold':
        newText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'underline':
        newText = `<u>${selectedText}</u>`;
        cursorOffset = 3;
        break;
      case 'code':
        newText = `\`${selectedText}\``;
        cursorOffset = 1;
        break;
      case 'link':
        if (isValidUrl(selectedText)) {
          newText = `[${selectedText}](${selectedText})`;
        } else {
          newText = `[${selectedText}](url)`;
        }
        break;
      case 'list':
        const listItems = selectedText.split('\n').map(item => `- ${item}`).join('\n');
        newText = listItems;
        break;
      case 'h1':
        newText = `# ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'h2':
        newText = `## ${selectedText}`;
        cursorOffset = 3;
        break;
      case 'h3':
        newText = `### ${selectedText}`;
        cursorOffset = 4;
        break;
      case 'strikethrough':
        newText = `~~${selectedText}~~`;
        cursorOffset = 2;
        break;
      case 'quote':
        if (!selectedText) {
          newText = '> ';
          cursorOffset = 2;
        } else {
          const quoteLines = selectedText.split('\n').map(line =>
            line.trim() === '' ? '>' : `> ${line}`
          ).join('\n');
          newText = quoteLines;
        }
        break;
      case 'tasklist':
        if (!selectedText) {
          newText = '- [ ] ';
          cursorOffset = 6;
        } else {
          const taskItems = selectedText.split('\n').map(item =>
            item.trim() === '' ? '' : `- [ ] ${item}`
          ).join('\n');
          newText = taskItems;
        }
        break;
      case 'hr':
        // Ensure the HR is on a new line, preceded by a blank line.
        const value = textarea.value;
        const textBeforeCursor = value.substring(0, start);
        const needsInitialNewline = textBeforeCursor.length > 0 && textBeforeCursor[textBeforeCursor.length - 1] !== '\n';
        
        newText = `${needsInitialNewline ? '\n' : ''}\n---\n`;
        cursorOffset = newText.length;
        break;
    }

    // Use execCommand for undo-friendly text replacement
    textarea.focus();
    textarea.setSelectionRange(start, end);
    document.execCommand('insertText', false, newText);

    // Manually trigger content update after execCommand
    onUpdate(textarea.value);

    // Update cursor position
    setTimeout(() => {
      if (syntax === 'link') {
        if (isValidUrl(selectedText)) {
          textarea.setSelectionRange(start + newText.length, start + newText.length);
        } else {
          const urlPos = start + selectedText.length + 3;
          textarea.setSelectionRange(urlPos, urlPos + 3);
        }
      } else if (selectedText) {
        textarea.setSelectionRange(start + newText.length, start + newText.length);
      } else {
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
    }, 0);
  };

  const handleBeautifyClick = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const textToProcess = selectedText || textarea.value;

    setOriginalText(textToProcess);
    setIsBeautifying(true); // Start loading

    try {
      const result = await performTextAction(textToProcess, 'beautify' as AITextAction);
      setBeautifiedText(result);
      setShowConfirmationModal(true);
    } catch (error) {
      console.error("Error beautifying text:", error);
      // Optionally show a toast notification for the error
    } finally {
      setIsBeautifying(false); // End loading
    }
  };

  const handleConfirmBeautify = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let updatedValue;

    if (originalText === textarea.value) { // If entire content was selected
      updatedValue = beautifiedText;
    } else { // If a selection was made
      updatedValue = textarea.value.substring(0, start) + beautifiedText + textarea.value.substring(end);
    }
    
    onUpdate(updatedValue);
    setShowConfirmationModal(false);
  };

  const primaryTools = (
    <>
      <ToolbarButton onClick={() => applyFormat('bold')} title="Bold (Ctrl+B)">
        <FaBold className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('italic')} title="Italic (Ctrl+I)">
        <FaItalic className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('underline')} title="Underline (Ctrl+U)">
        <FaUnderline className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('h1')} title="Heading 1" className="relative">
        <FaHeading className="w-5 h-5" /><span className="absolute text-[0.6rem] font-bold top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">1</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('h2')} title="Heading 2" className="relative">
        <FaHeading className="w-5 h-5" /><span className="absolute text-[0.6rem] font-bold top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">2</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('h3')} title="Heading 3" className="relative">
        <FaHeading className="w-5 h-5" /><span className="absolute text-[0.6rem] font-bold top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">3</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('code')} title="Code">
        <FaCode className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('link')} title="Link">
        <FaLink className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('list')} title="Bulleted List">
        <FaListUl className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={handleBeautifyClick} title="Beautify (AI)" disabled={isBeautifying}>
        {isBeautifying ? (
          <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
        ) : (
          <FaRegStar className="w-5 h-5" />
        )}
      </ToolbarButton>
    </>
  );

  const secondaryTools = (
    <>
      <ToolbarButton onClick={() => applyFormat('strikethrough')} title="Strikethrough">
        <FaStrikethrough className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('quote')} title="Quote">
        <FaQuoteRight className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('tasklist')} title="Task List">
        <FaListCheck className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('hr')} title="Horizontal Rule">
        <FaMinus className="w-5 h-5" />
      </ToolbarButton>
    </>
  );

  return (
    <>
      <div className="border-b border-border-color dark:border-dark-border-color">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {primaryTools}
            <div className="hidden md:flex items-center space-x-1">
              {secondaryTools}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <ToolbarButton
              onClick={() => setShowAllTools(!showAllTools)}
              title="More tools"
              className="md:hidden"
            >
              <FaEllipsis className="w-5 h-5" />
            </ToolbarButton>
            <div className="w-px h-6 bg-border-color dark:bg-dark-border-color mx-2"></div>
            <ToolbarButton onClick={onGenerateClick} title="Generate Note with AI">
              <FaWandMagicSparkles className="w-5 h-5 text-accent dark:text-dark-accent" />
            </ToolbarButton>
          </div>
        </div>
        {showAllTools && (
          <div className="md:hidden flex items-center space-x-1 px-2 py-1 bg-bg-secondary dark:bg-dark-bg-secondary overflow-x-auto">
            {secondaryTools}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmBeautify}
        title="Apply Beautified Text?"
        message={
          <>
            <p className="mb-2 text-text-primary dark:text-dark-text-primary">Original text:</p>
            <div className="bg-bg-tertiary dark:bg-dark-tertiary p-3 rounded-md max-h-[30vh] overflow-y-auto mb-4 text-sm border border-border-color dark:border-dark-border-color">
              {originalText}
            </div>
            <p className="mb-2 text-text-primary dark:text-dark-text-primary">Beautified text:</p>
            <div className="bg-bg-tertiary dark:bg-dark-tertiary p-3 rounded-md max-h-[30vh] overflow-y-auto text-sm border border-border-color dark:border-dark-border-color">
              {beautifiedText}
            </div>
          </>
        }
        confirmText="Apply Changes"
        cancelText="Discard"
      />
    </>
  );
};

export default EditorToolbar;