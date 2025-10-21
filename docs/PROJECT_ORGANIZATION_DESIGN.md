# Project Organization System - Design Document

## Overview
This document outlines the design for adding project/folder organization to Stellar Scribe, transforming it from a flat note list to a hierarchical project-based system.

---

## 1. Data Model

### 1.1 Project Schema

```typescript
interface Project {
  id: string;                    // Unique identifier (UUID)
  title: string;                 // Project name
  description?: string;          // Optional project description
  color: string;                 // Color theme for visual identification
  icon?: string;                 // Optional emoji or icon
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
  isPinned: boolean;             // Pin projects for quick access
  isArchived: boolean;           // Archive completed projects
  
  // Project settings
  settings: {
    defaultTags?: string[];      // Auto-apply tags to new notes
    defaultSorting?: SortOption; // Default sort for notes in this project
    defaultView?: 'grid' | 'list'; // How to display notes
  };
  
  // Metadata
  noteCount: number;             // Cached count for performance
  lastActivityAt: number;        // Last time a note was modified
}
```

### 1.2 Updated Note Schema

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  isPinned: boolean;
  isImported?: boolean;
  importedAt?: number;
  
  // NEW: Project relationship
  projectId: string | null;      // null = "All Notes" / Unorganized
  
  // Version control
  version?: number;
  lastVersionedAt?: number;
  lastTransaction?: {
    from: number;
    to: number;
    text: string;
    removed: string;
    origin: string;
  };
}
```

### 1.3 Database Schema (Supabase)

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  note_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index for faster queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_pinned ON projects(is_pinned) WHERE is_pinned = TRUE;

-- Update notes table to add project_id
ALTER TABLE notes 
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX idx_notes_project_id ON notes(project_id);

-- Trigger to update project's note_count and last_activity_at
CREATE OR REPLACE FUNCTION update_project_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET note_count = note_count + 1,
        last_activity_at = NEW.updated_at
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.project_id != OLD.project_id THEN
      -- Note moved between projects
      UPDATE projects SET note_count = note_count - 1 WHERE id = OLD.project_id;
      UPDATE projects SET note_count = note_count + 1, last_activity_at = NEW.updated_at WHERE id = NEW.project_id;
    ELSE
      -- Note updated
      UPDATE projects SET last_activity_at = NEW.updated_at WHERE id = NEW.project_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET note_count = note_count - 1 
    WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_metadata
AFTER INSERT OR UPDATE OR DELETE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_project_metadata();
```

---

## 2. API Design

### 2.1 Local Storage Strategy

For the current localStorage-based implementation:

```typescript
// Storage keys
const STORAGE_KEYS = {
  PROJECTS: 'stellar-scribe-projects-v1',
  NOTES: 'stellar-scribe-notes-v2',
  ACTIVE_PROJECT: 'stellar-scribe-active-project-id',
};

// Service methods
interface ProjectService {
  // CRUD
  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project;
  getProject(id: string): Project | null;
  getAllProjects(): Project[];
  updateProject(id: string, updates: Partial<Project>): Project;
  deleteProject(id: string, deleteNotes?: boolean): void;
  
  // Organization
  moveNotesToProject(noteIds: string[], projectId: string | null): void;
  duplicateProject(id: string, includeNotes?: boolean): Project;
  archiveProject(id: string): void;
  
  // Queries
  getProjectNotes(projectId: string): Note[];
  getUnorganizedNotes(): Note[];
  searchInProject(projectId: string, query: string): Note[];
  
  // Metadata
  updateProjectMetadata(projectId: string): void;
  getProjectStats(projectId: string): ProjectStats;
}
```

### 2.2 Future Supabase API (REST-like)

```typescript
// API endpoints structure
const API_ENDPOINTS = {
  // Projects
  'GET    /api/projects': 'List all projects',
  'POST   /api/projects': 'Create new project',
  'GET    /api/projects/:id': 'Get project details',
  'PUT    /api/projects/:id': 'Update project',
  'DELETE /api/projects/:id': 'Delete project',
  'POST   /api/projects/:id/archive': 'Archive project',
  'POST   /api/projects/:id/duplicate': 'Duplicate project',
  
  // Notes in projects
  'GET    /api/projects/:id/notes': 'List notes in project',
  'POST   /api/projects/:id/notes': 'Create note in project',
  'PUT    /api/notes/:id/move': 'Move note to different project',
  'POST   /api/projects/:id/notes/bulk-move': 'Move multiple notes',
  
  // Search
  'GET    /api/projects/:id/search': 'Search within project',
  'GET    /api/search?project=:id': 'Global search with project filter',
};
```

---

## 3. UI/UX Design

### 3.1 Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Header (Search, View Controls, Theme)                      │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│  Projects    │  Notes List          │  Editor & Preview     │
│  Sidebar     │  (filtered by proj)  │  (split/single view)  │
│              │                      │                       │
│ • All Notes  │  ┌──────────────┐   │  ┌─────────────────┐ │
│ • Project 1  │  │ Note Title   │   │  │                 │ │
│ • Project 2  │  │ Preview...   │   │  │  Note Editor    │ │
│   (5 notes)  │  └──────────────┘   │  │                 │ │
│ • Project 3  │  ┌──────────────┐   │  └─────────────────┘ │
│              │  │ Note Title   │   │                       │
│ [+ New]      │  └──────────────┘   │                       │
│              │                      │                       │
└──────────────┴──────────────────────┴───────────────────────┘
```

### 3.2 Three-Panel Layout

1. **Left Panel: Project Navigator** (200-280px, collapsible)
   - "All Notes" (shows all notes across projects)
   - "Unorganized" (notes without a project)
   - List of projects (scrollable)
   - Pinned projects at top
   - Create new project button
   - Search/filter projects

2. **Middle Panel: Note List** (existing, 300-400px)
   - Filtered by selected project
   - Drag handles for reordering
   - Multi-select support
   - Quick actions (move, delete, pin)

3. **Right Panel: Editor** (existing, flexible)
   - Current note editor
   - Project indicator badge
   - Quick project switcher

### 3.3 Project List Component Features

```typescript
// Visual Design
- Color-coded project cards/rows
- Icon/emoji support
- Note count badge
- Last activity timestamp
- Progress indicator (optional)
- Pinned badge
- Archive badge

// Interactions
- Click to filter notes
- Right-click context menu
- Drag note onto project to move
- Expand/collapse project details
- Hover shows quick stats
```

### 3.4 Drag & Drop Behavior

**Source:** Note items in middle panel
**Targets:** Project items in left panel, "Unorganized" area

```typescript
// Drag Events
onDragStart: Mark note as being dragged
onDragOver: Highlight valid drop targets
onDrop: Move note to target project
onDragEnd: Clean up visual indicators

// Multi-select Drag
- Hold Ctrl/Cmd to select multiple notes
- Drag any selected note to move all
- Visual count indicator (e.g., "3 notes")
```

### 3.5 Mobile Adaptations

**Mobile Layout (< 768px):**
```
┌─────────────────────────────┐
│  Header with hamburger menu │
├─────────────────────────────┤
│                             │
│  View: Projects | Notes     │
│  (toggle tabs)              │
│                             │
│  [Currently visible view]   │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

- Tab-based navigation between Projects/Notes/Editor
- Bottom sheet for project selection
- Long-press context menu instead of right-click
- Swipe gestures for quick actions

---

## 4. State Management

### 4.1 React State Structure

```typescript
// App-level state
interface AppState {
  // Existing
  notes: Note[];
  activeNoteId: string | null;
  searchTerm: string;
  
  // New: Project state
  projects: Project[];
  activeProjectId: string | null; // null = "All Notes"
  projectsExpanded: boolean;
  
  // UI state
  isProjectSidebarOpen: boolean;
  selectedNoteIds: Set<string>; // For multi-select
}
```

### 4.2 Custom Hooks

```typescript
// useProjects hook
const useProjects = () => {
  const [projects, setProjects] = useLocalStorage<Project[]>('stellar-scribe-projects-v1', []);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | null>('stellar-scribe-active-project-id', null);
  
  const createProject = useCallback(...);
  const updateProject = useCallback(...);
  const deleteProject = useCallback(...);
  const moveNotesToProject = useCallback(...);
  
  return { projects, activeProjectId, ... };
};

// useProjectNotes hook - memoized filtered notes
const useProjectNotes = (projectId: string | null, allNotes: Note[]) => {
  return useMemo(() => {
    if (projectId === null) return allNotes; // "All Notes"
    if (projectId === 'unorganized') return allNotes.filter(n => !n.projectId);
    return allNotes.filter(n => n.projectId === projectId);
  }, [projectId, allNotes]);
};
```

### 4.3 Caching Strategy

```typescript
// Computed values cached with useMemo
const projectStats = useMemo(() => 
  projects.map(p => ({
    id: p.id,
    noteCount: notes.filter(n => n.projectId === p.id).length,
    lastActivity: Math.max(...notes.filter(n => n.projectId === p.id).map(n => n.updatedAt), 0),
  })),
  [projects, notes]
);

// Debounced updates for metadata
const updateProjectMetadata = useDebouncedCallback((projectId: string) => {
  // Update note count, last activity, etc.
}, 500);
```

---

## 5. Edge Cases & Challenges

### 5.1 Data Migration

**Challenge:** Existing users have notes without projectId

**Solution:**
```typescript
// Migration function
const migrateNotesToProjects = () => {
  // 1. Check if migration needed
  // 2. Create default "General" project
  // 3. Assign all existing notes to it (or leave as null)
  // 4. Mark migration complete
};
```

### 5.2 Project Deletion

**Challenge:** What happens to notes when project is deleted?

**Solutions:**
1. **Move to "Unorganized"** (default, safest)
2. **Delete notes** (with confirmation, dangerous)
3. **Move to another project** (user selects)

Implementation:
```typescript
const deleteProject = (id: string, strategy: 'unorganize' | 'delete' | 'move', targetProjectId?: string) => {
  const projectNotes = notes.filter(n => n.projectId === id);
  
  switch(strategy) {
    case 'unorganize':
      projectNotes.forEach(n => updateNote(n.id, { projectId: null }));
      break;
    case 'delete':
      projectNotes.forEach(n => deleteNote(n.id));
      break;
    case 'move':
      projectNotes.forEach(n => updateNote(n.id, { projectId: targetProjectId }));
      break;
  }
  
  removeProject(id);
};
```

### 5.3 Search Scope

**Challenge:** Should search be global or project-scoped?

**Solution:** Hybrid approach
- Default: Search within active project
- Option: "Search in all projects" toggle
- Search results show project badges
- Click result switches to that project

### 5.4 Performance with Many Projects/Notes

**Challenges:**
- Large project lists slow to render
- Filtering notes on every keystroke
- Drag-drop with many items

**Optimizations:**
```typescript
// 1. Virtualized lists for projects and notes
import { FixedSizeList } from 'react-window';

// 2. Memoized filtering
const filteredNotes = useMemo(() => filterNotes(notes, searchTerm, projectId), [notes, searchTerm, projectId]);

// 3. Debounced search
const debouncedSearch = useDebouncedValue(searchTerm, 300);

// 4. Lazy loading archived projects
const [showArchived, setShowArchived] = useState(false);
```

### 5.5 Conflicting Actions

**Challenge:** User drags note while it's being edited

**Solution:**
- Disable drag during active editing
- Show visual indicator when drag is disabled
- Auto-save before allowing drag

### 5.6 Keyboard Navigation

**Challenge:** Navigating between projects, notes, and editor with keyboard

**Solution:**
```typescript
// New keyboard shortcuts
'Ctrl/Cmd + Shift + P': 'Open project palette',
'Ctrl/Cmd + Shift + N': 'Create new project',
'Ctrl/Cmd + Shift + M': 'Move note to project',
'Alt + ←/→': 'Switch between projects',
'Alt + 1-9': 'Jump to project 1-9',
```

### 5.7 Undo/Redo for Project Operations

**Challenge:** User accidentally moves note or deletes project

**Solution:**
```typescript
// Extend undo system to track project operations
interface ProjectAction {
  type: 'move' | 'delete_project' | 'create_project';
  timestamp: number;
  data: any;
  undo: () => void;
  redo: () => void;
}

// Toast with undo action
addToast('Note moved to Project X', 'success', { 
  action: { label: 'Undo', onClick: () => undoLastAction() }
});
```

### 5.8 Shared Notes and Projects

**Challenge:** Imported notes don't belong to a project initially

**Solution:**
- Prompt user to select project on import
- Default to "Unorganized"
- Allow bulk organization later

---

## 6. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Update TypeScript types
- [ ] Create project service (localStorage)
- [ ] Add project storage hooks
- [ ] Create basic ProjectList component
- [ ] Update Note model with projectId

### Phase 2: UI Components (Week 2)
- [ ] Build ProjectSidebar component
- [ ] Add ProjectModal for create/edit
- [ ] Update NoteList for project filtering
- [ ] Add project badges to notes
- [ ] Implement project color themes

### Phase 3: Drag & Drop (Week 3)
- [ ] Add react-dnd or native drag-drop
- [ ] Implement note dragging
- [ ] Implement project drop targets
- [ ] Add visual feedback
- [ ] Handle multi-select drag

### Phase 4: Advanced Features (Week 4)
- [ ] Project-scoped search
- [ ] Project settings UI
- [ ] Archive functionality
- [ ] Project templates
- [ ] Keyboard shortcuts

### Phase 5: Polish & Migration (Week 5)
- [ ] Data migration for existing users
- [ ] Performance optimizations
- [ ] Mobile responsive design
- [ ] Documentation
- [ ] User guide/onboarding

---

## 7. Alternative Approaches Considered

### 7.1 Tags-Based Organization
**Rejected because:** Less intuitive than projects, harder to visualize hierarchy

### 7.2 Nested Folders (unlimited depth)
**Rejected because:** Too complex for most use cases, harder UI/UX

### 7.3 Flat Tags + Smart Filters
**Could complement:** Use alongside projects for finer organization

---

## 8. Success Metrics

- User adoption: % of users creating at least one project
- Organization rate: % of notes assigned to projects
- Performance: List render time < 100ms for 1000 notes
- User satisfaction: Positive feedback on project features
- Retention: Increased daily active users due to better organization

---

## 9. Future Enhancements

1. **Project Templates**: Pre-built projects for common use cases
2. **Project Sharing**: Share entire projects with collaborators
3. **Project Export/Import**: Backup and transfer projects
4. **Smart Projects**: Auto-organize based on AI analysis
5. **Project Views**: Kanban, calendar, table views
6. **Nested Sub-Projects**: 2-level hierarchy
7. **Project-Level AI**: Summarize all notes in a project
8. **Cross-Project References**: Link notes across projects

---

## 10. Technical Dependencies

### New npm packages:
```json
{
  "@dnd-kit/core": "^6.0.8",           // Modern drag-and-drop
  "@dnd-kit/sortable": "^7.0.2",       // Sortable lists
  "@dnd-kit/utilities": "^3.2.1",      // DnD utilities
  "react-window": "^1.8.10",           // Virtual scrolling (optional)
  "use-debounce": "^10.0.0"            // Debounced values
}
```

---

## Conclusion

This design provides a robust, scalable project organization system that:
- ✅ Maintains backward compatibility
- ✅ Scales to hundreds of projects and thousands of notes
- ✅ Provides intuitive drag-and-drop UX
- ✅ Works offline with localStorage
- ✅ Ready for future Supabase sync
- ✅ Mobile-friendly
- ✅ Keyboard accessible

The phased implementation allows for iterative development and user feedback integration.
