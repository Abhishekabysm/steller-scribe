# Version Restore Behavior Configuration

## Overview

Stellar Scribe supports two different approaches for version restoration. You can configure which behavior you prefer by modifying the `RESTORE_CONFIG` in `services/versionControlService.ts`.

## Approach 1: Clean Restore (Default - Recommended)

**Configuration:** `createNewVersionOnRestore: false`

**Behavior:**
- When you restore a version, the content is applied directly to the editor
- No new version entry is created in the history
- The version history remains unchanged and clean
- Only meaningful content changes create new versions

**Example:**
```
Before restore: v2, v1
After restore v1: v2, v1 (no new entry)
```

**Pros:**
- Cleaner version history
- No clutter from administrative actions
- More intuitive for users
- Focuses on actual content changes

**Cons:**
- No record of when restores happened
- Can't track restoration history

## Approach 2: Restore with History

**Configuration:** `createNewVersionOnRestore: true`

**Behavior:**
- When you restore a version, a new version entry is created
- The history shows when restores happened
- Each restore operation is tracked

**Example:**
```
Before restore: v2, v1
After restore v1: v3 (Restored to version 1), v2, v1
```

**Pros:**
- Complete audit trail of all operations
- Can track when restores happened
- Useful for debugging or compliance

**Cons:**
- Version history can become cluttered
- Less intuitive for users
- Administrative actions mixed with content changes

## How to Change the Behavior

1. Open `services/versionControlService.ts`
2. Find the `RESTORE_CONFIG` section at the top
3. Change the value of `createNewVersionOnRestore`:
   - `false` = Clean restore (default)
   - `true` = Restore with history

```typescript
const RESTORE_CONFIG = {
  createNewVersionOnRestore: false, // Change this value to switch behavior
} as const;
```

## Recommendation

For a note-taking app like Stellar Scribe, **Approach 1 (Clean Restore)** is recommended because:

1. Users typically want to see meaningful content changes, not administrative actions
2. The version history stays clean and focused
3. It's more intuitive - when you restore, you expect to go back to that state
4. Most popular note-taking apps use this approach

However, if you need complete audit trails or are building for enterprise use, Approach 2 might be more appropriate.

## Technical Implementation

The restore logic is implemented in:
- `services/versionControlService.ts` - Core restore logic
- `hooks/useVersionControl.ts` - Hook for version control operations
- `components/NoteEditor.tsx` - UI integration

The configuration is checked in the `restoreVersion` method and determines whether to create a new version entry or just return the target version content.
