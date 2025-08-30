# Version Control Feature

## Overview

The Version Control feature in Stellar Scribe allows you to track changes to your notes over time and restore previous versions when needed. This provides a safety net for your work and enables you to experiment with changes without losing your original content.

## Features

### Auto-Save
- **Automatic Versioning**: The system automatically creates versions every 30 seconds when you make changes
- **Smart Detection**: Only creates versions when there are meaningful changes (minimum 10 characters changed)
- **Background Operation**: Runs silently in the background without interrupting your workflow

### Manual Version Control
- **Save Version Button**: Click the save icon (💾) in the toolbar to manually create a version
- **Version History**: Access the full version history by clicking the clock icon (🕐) in the toolbar
- **Change Descriptions**: Each version includes an automatic description of what changed

### Version Management
- **View All Versions**: Browse through all saved versions with timestamps and change descriptions
- **Compare Versions**: Select two versions to compare their differences side-by-side
- **Restore Versions**: Restore any previous version with a single click
- **Delete Versions**: Remove unwanted versions to save storage space

### Storage Management
- **Automatic Cleanup**: Old versions are automatically managed to prevent excessive storage use
- **Storage Monitoring**: View total storage usage and version count
- **Manual Cleanup**: Option to manually clean up old versions

## How to Use

### Creating Versions

1. **Auto-Save**: Simply edit your note - versions are created automatically every 30 seconds
2. **Manual Save**: Click the save icon (💾) in the editor toolbar to create a version immediately

### Viewing Version History

1. Click the clock icon (🕐) in the editor toolbar
2. Browse through the list of versions on the left
3. Click on any version to view its content on the right
4. Use the "Compare" mode to select two versions for side-by-side comparison

### Restoring a Version

1. Open the Version History modal
2. Select the version you want to restore
3. Click the "Restore" button
4. The note will be updated with the selected version's content

### Comparing Versions

1. Open the Version History modal
2. Click "Compare" to enter comparison mode
3. Select two versions to compare
4. View the differences side-by-side
5. See statistics about added/removed lines and characters

## Technical Details

### Storage
- Versions are stored locally in your browser's localStorage
- Each note can have up to 50 versions
- Automatic cleanup removes old versions when the limit is reached
- Storage usage is displayed in the version history modal

### Version Types
- **Auto**: Automatically created every 30 seconds when changes are detected
- **Manual**: Created when you click the save button
- **Restore**: Created when you restore a previous version

### Change Detection
- Tracks line additions, deletions, and character changes
- Only creates versions for meaningful changes (minimum 10 characters)
- Provides descriptive summaries of what changed

## Keyboard Shortcuts

- **Ctrl/Cmd + S**: Create a manual version (if implemented)
- **Ctrl/Cmd + H**: Open version history (if implemented)

## Best Practices

1. **Regular Manual Saves**: Create manual versions before making major changes
2. **Descriptive Versions**: The system automatically describes changes, but you can add custom descriptions
3. **Storage Management**: Periodically clean up old versions to maintain performance
4. **Version Comparison**: Use the compare feature to understand what changed between versions

## Troubleshooting

### Versions Not Saving
- Check if auto-save is enabled
- Ensure you're making meaningful changes (at least 10 characters)
- Check browser storage limits

### Can't Restore Versions
- Ensure the version exists in the history
- Check if the note is currently active
- Try refreshing the page if issues persist

### Storage Issues
- Use the cleanup feature to remove old versions
- Check browser storage settings
- Consider exporting important versions before cleanup

## Future Enhancements

- Cloud sync for versions
- Branching and merging capabilities
- Collaborative version control
- Advanced diff visualization
- Version tagging and labeling
- Export/import version history
