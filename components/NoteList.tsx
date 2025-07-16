import React from 'react';
import { Note, SortOption } from '../types';
import { FaRegSquarePlus, FaPlus, FaThumbtack, FaXmark, FaRegTrashCan } from 'react-icons/fa6';
import Dropdown from './Dropdown';
import { MdCloudDownload } from 'react-icons/md';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  sortOption: SortOption;
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onDeletePinnedNote: (note: Note) => void;
  onSortChange: (option: SortOption) => void;
  searchTerm: string;
  onCloseSidebar?: () => void;
}

const Tag: React.FC<{ tag: string }> = ({ tag }) => (
  <span className="text-xs font-medium mr-1.5 px-2 py-0.5 rounded-full bg-accent/10 text-accent dark:bg-dark-accent/20 dark:text-dark-accent-hover">
    #{tag}
  </span>
);

const NoteListItem: React.FC<{ note: Note; isActive: boolean; onClick: () => void; onTogglePin: (id: string) => void; onDelete: (note: Note) => void }> = ({ note, isActive, onClick, onTogglePin, onDelete }) => {
  const date = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: 'short',
    day: 'numeric',
  });

  const handleClick = (e: React.MouseEvent) => {
    // Don't select note if clicking on pin button or delete button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick();
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onTogglePin(note.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(note);
  };

  return (
    <li
      onClick={handleClick}
      className={`group cursor-pointer p-3 border-l-4 rounded-r-md transition-all duration-200 ease-in-out relative ${
        isActive
          ? 'bg-accent/20 border-accent dark:bg-dark-accent/20 dark:border-dark-accent'
          : 'bg-surface/50 border-transparent hover:bg-surface hover:border-text-muted/50 dark:bg-dark-surface/50 dark:hover:bg-dark-surface dark:hover:border-dark-text-muted/50'
      }`}
      aria-current={isActive}
    >
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <button 
          onClick={handlePinClick} 
          className={`p-1.5 rounded-full text-text-muted/60 hover:text-accent dark:text-dark-text-muted/60 dark:hover:text-dark-accent transition-colors ${note.isPinned ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}
          title={note.isPinned ? 'Unpin note' : 'Pin note'}
        >
          <FaThumbtack className={`w-4 h-4 sm:w-5 sm:h-5 ${note.isPinned ? 'text-accent dark:text-dark-accent' : ''}`} />
        </button>
        <button 
          onClick={handleDeleteClick} 
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-full text-red-500/80 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 shadow-sm"
          title="Delete note"
        >
          <FaRegTrashCan className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
      <h3 className="font-bold text-text-primary dark:text-dark-text-primary truncate pr-16 flex items-center gap-2">
        <span className="truncate">{note.title || 'Untitled Note'}</span>
        {note.isImported && (
          <MdCloudDownload 
            className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" 
            title="Imported note"
          />
        )}
      </h3>
      <div className="flex items-center mt-1.5">
        <p className="text-sm text-text-muted dark:text-dark-text-muted truncate">
          <span className="mr-2">{date}</span>
          {note.content.substring(0, 30).replace(/#|`|\*|\[|\]/g, '')}...
        </p>
      </div>
      {note.tags && note.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-y-1">
              {note.tags.slice(0, 3).map(tag => <Tag key={tag} tag={tag} />)}
          </div>
      )}
    </li>
  );
};

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="px-3 pt-4 pb-1 text-sm font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wider">{children}</h2>
);


const NoteList: React.FC<NoteListProps> = ({ notes, activeNoteId, onSelectNote, onAddNote, onTogglePin, onDeleteNote, onDeletePinnedNote, searchTerm, sortOption, onSortChange, onCloseSidebar }) => {
    const handleDeleteClick = (note: Note) => {
        if (note.isPinned) {
            onDeletePinnedNote(note);
        } else {
            onDeleteNote(note.id);
        }
    };
    const sortedAndFilteredNotes = React.useMemo(() => {
        const filtered = notes.filter(note => {
            if (!searchTerm) return true;
            const lowerSearchTerm = searchTerm.toLowerCase();
            const inTitle = note.title.toLowerCase().includes(lowerSearchTerm);
            const inContent = note.content.toLowerCase().includes(lowerSearchTerm);
            const inTags = note.tags?.some(tag => tag.toLowerCase().includes(lowerSearchTerm));
            return inTitle || inContent || inTags;
        });

        return filtered.sort((a, b) => {
            switch(sortOption) {
                case 'createdAt': return b.createdAt - a.createdAt;
                case 'title': return a.title.localeCompare(b.title);
                case 'updatedAt':
                default:
                    return b.updatedAt - a.updatedAt;
            }
        });
    }, [notes, searchTerm, sortOption]);

    const pinnedNotes = sortedAndFilteredNotes.filter(n => n.isPinned);
    const otherNotes = sortedAndFilteredNotes.filter(n => !n.isPinned);

    const sortOptions = [
        { value: 'updatedAt', label: 'Last Updated' },
        { value: 'createdAt', label: 'Date Created' },
        { value: 'title', label: 'Title (A-Z)' },
    ];

  return (
    <div className="h-full bg-bg-secondary dark:bg-dark-bg-secondary flex flex-col">
      <div className="p-2 border-b border-border-color dark:border-dark-border-color flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="hidden md:block p-1 rounded-full hover:bg-bg-primary dark:hover:bg-dark-bg-primary text-text-muted dark:text-dark-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
              title="Close sidebar"
            >
              <FaXmark className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">Notes</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Dropdown 
              options={sortOptions}
              value={sortOption}
              onChange={(value) => onSortChange(value as SortOption)}
          />
        </div>
      </div>
      <div className="p-3 border-b border-border-color dark:border-dark-border-color">
        <button
          onClick={onAddNote}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 dark:bg-dark-accent dark:hover:bg-dark-accent/90 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          <FaPlus className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium leading-4">New Note</span>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
      {sortedAndFilteredNotes.length > 0 ? (
        <div className="pb-16 sm:pb-12">
          {pinnedNotes.length > 0 && (
              <section>
                <SectionHeader>Pinned</SectionHeader>
                <ul className="space-y-1 p-2">
                  {pinnedNotes.map(note => (
                    <NoteListItem
                      key={note.id}
                      note={note}
                      isActive={note.id === activeNoteId}
                      onClick={() => onSelectNote(note.id)}
                      onTogglePin={() => onTogglePin(note.id)}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </ul>
              </section>
          )}
          {otherNotes.length > 0 && (
             <section>
                {pinnedNotes.length > 0 && <SectionHeader>Recent</SectionHeader>}
                 <ul className="space-y-1 p-2">
                  {otherNotes.map(note => (
                    <NoteListItem
                      key={note.id}
                      note={note}
                      isActive={note.id === activeNoteId}
                      onClick={() => onSelectNote(note.id)}
                      onTogglePin={() => onTogglePin(note.id)}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-text-muted dark:text-dark-text-muted flex flex-col items-center justify-center h-full">
            <FaRegSquarePlus className="w-16 h-16 mb-4 text-text-muted/50 dark:text-dark-text-muted/50" />
            <h3 className="text-lg font-semibold text-text-secondary dark:text-dark-text-secondary">
              {searchTerm ? 'No matching notes' : 'No notes yet'}
            </h3>
            <p className="text-sm mt-1 mb-6">
              {searchTerm ? 'Try a different search term.' : 'Your new ideas are waiting!'}
            </p>
            {!searchTerm && (
                <button
                    onClick={onAddNote}
                    className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover transition-colors font-semibold"
                >
                    <FaPlus className="w-5 h-5" />
                    <span>Create First Note</span>
                </button>
            )}
        </div>
      )}
      </div>
    </div>
  );
};

export default NoteList;