

import React, { useState } from 'react';
import BoldLetterIcon from './icons/BoldLetterIcon';
import ItalicLetterIcon from './icons/ItalicLetterIcon';
import UnderlineIcon from './icons/UnderlineIcon';
import LinkIcon from './icons/LinkIcon';
import CodeIcon from './icons/CodeIcon';
import ListIcon from './icons/ListIcon';
import MagicIcon from './icons/MagicIcon';
import HeadingIcon from './icons/HeadingIcon';
import StrikethroughIcon from './icons/StrikethroughIcon';
import QuoteIcon from './icons/QuoteIcon';
import TaskListIcon from './icons/TaskListIcon';
import HorizontalRuleIcon from './icons/HorizontalRuleIcon';


interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onUpdate: (value: string) => void;
  onGenerateClick: () => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; title: string }> = ({ onClick, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
  >
    {children}
  </button>
);

const EditorToolbar: React.FC<EditorToolbarProps> = ({ textareaRef, onUpdate, onGenerateClick }) => {
  const [showAllTools, setShowAllTools] = useState(false);
  
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
        newText = `[${selectedText}](url)`;
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
        newText = '\n---\n';
        break;
    }

    const updatedValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    onUpdate(updatedValue);
    
    // Focus and update cursor position
    textarea.focus();
    setTimeout(() => {
        if (syntax === 'link') {
             const urlPos = start + selectedText.length + 3;
             textarea.setSelectionRange(urlPos, urlPos + 3);
        } else if (selectedText) {
            textarea.setSelectionRange(start + newText.length, start + newText.length);
        } else {
            textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
        }
    }, 0);
  };



  const primaryTools = (
    <>
      <ToolbarButton onClick={() => applyFormat('bold')} title="Bold (Ctrl+B)">
        <BoldLetterIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('italic')} title="Italic (Ctrl+I)">
        <ItalicLetterIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('underline')} title="Underline (Ctrl+U)">
        <UnderlineIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('h1')} title="Heading 1">
        <HeadingIcon className="w-5 h-5" level={1} />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('h2')} title="Heading 2">
        <HeadingIcon className="w-5 h-5" level={2} />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('h3')} title="Heading 3">
        <HeadingIcon className="w-5 h-5" level={3} />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('code')} title="Code">
        <CodeIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('link')} title="Link">
        <LinkIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('list')} title="Bulleted List">
        <ListIcon className="w-5 h-5" />
      </ToolbarButton>
    </>
  );

  const secondaryTools = (
    <>
      <ToolbarButton onClick={() => applyFormat('strikethrough')} title="Strikethrough">
        <StrikethroughIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('quote')} title="Quote">
        <QuoteIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('tasklist')} title="Task List">
        <TaskListIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => applyFormat('hr')} title="Horizontal Rule">
        <HorizontalRuleIcon className="w-5 h-5" />
      </ToolbarButton>
    </>
  );

  return (
    <div className="border-b border-border-color dark:border-dark-border-color">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {primaryTools}
          <div className="hidden md:flex items-center space-x-1">
            {secondaryTools}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowAllTools(!showAllTools)}
            className="md:hidden p-2 rounded-md text-text-muted dark:text-dark-text-muted hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
            title="More tools"
          >
            <span className="text-sm">•••</span>
          </button>
          <div className="w-px h-6 bg-border-color dark:bg-dark-border-color mx-2"></div>
          <ToolbarButton onClick={onGenerateClick} title="Generate Note with AI">
            <MagicIcon className="w-5 h-5 text-accent dark:text-dark-accent" />
          </ToolbarButton>
        </div>
      </div>
      {showAllTools && (
        <div className="md:hidden flex items-center space-x-1 px-2 py-1 bg-bg-secondary dark:bg-dark-bg-secondary overflow-x-auto">
          {secondaryTools}
        </div>
      )}
    </div>
  );
};

export default EditorToolbar;