import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { ProjectService } from '../services/projectService';
import { 
  FaXmark,
  FaFolder,
  FaFolderOpen,
  FaBook,
  FaBookOpen,
  FaFileLines,
  FaClipboard,
  FaBriefcase,
  FaLightbulb,
  FaRocket,
  FaFire,
  FaPaintbrush,
  FaFlask,
  FaGraduationCap,
  FaHeart,
  FaStar,
  FaCircle
} from 'react-icons/fa6';
import { MdWork, MdHome, MdSettings } from 'react-icons/md';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'noteCount' | 'lastActivityAt'>) => void;
  existingProject?: Project | null;
  mode: 'create' | 'edit';
}

const PROJECT_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Emerald', value: '#059669' },
];

const PROJECT_ICONS = [
  { name: 'folder', icon: FaFolder },
  { name: 'folder-open', icon: FaFolderOpen },
  { name: 'book', icon: FaBook },
  { name: 'book-open', icon: FaBookOpen },
  { name: 'file', icon: FaFileLines },
  { name: 'clipboard', icon: FaClipboard },
  { name: 'star', icon: FaStar },
  { name: 'lightbulb', icon: FaLightbulb },
  { name: 'rocket', icon: FaRocket },
  { name: 'fire', icon: FaFire },
  { name: 'briefcase', icon: FaBriefcase },
  { name: 'paintbrush', icon: FaPaintbrush },
  { name: 'flask', icon: FaFlask },
  { name: 'graduation', icon: FaGraduationCap },
  { name: 'heart', icon: FaHeart },
  { name: 'work', icon: MdWork },
  { name: 'home', icon: MdHome },
  { name: 'settings', icon: MdSettings },
  { name: 'circle', icon: FaCircle },
];

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingProject,
  mode,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(ProjectService.getRandomColor());
  const [icon, setIcon] = useState('folder');
  const [isPinned, setIsPinned] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Initialize form with existing project data
  useEffect(() => {
    if (mode === 'edit' && existingProject) {
      setTitle(existingProject.title);
      setDescription(existingProject.description || '');
      setColor(existingProject.color);
      setIcon(existingProject.icon || 'folder');
      setIsPinned(existingProject.isPinned);
    } else if (mode === 'create') {
      // Reset form for new project
      setTitle('');
      setDescription('');
      setColor(ProjectService.getRandomColor());
      setIcon('folder');
      setIsPinned(false);
    }
    setErrors([]);
  }, [mode, existingProject, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'noteCount' | 'lastActivityAt'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      color,
      icon,
      isPinned,
      isArchived: existingProject?.isArchived || false,
      settings: existingProject?.settings || {},
    };

    const validation = ProjectService.validateProject(projectData);
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onSave(projectData);
    onClose();
  };

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  const SelectedIconComponent = PROJECT_ICONS.find(i => i.name === icon)?.icon || FaFolder;

  return (
    <div 
      className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div 
        className="relative bg-white/90 dark:bg-gray-950/90 backdrop-blur-2xl rounded-[28px] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20 dark:border-white/10 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Liquid Glass Reflection Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent pointer-events-none rounded-[28px]" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-6 border-b border-black/5 dark:border-white/10 bg-gradient-to-b from-white/50 to-white/30 dark:from-white/5 dark:to-transparent backdrop-blur-xl">
          <h2 className="text-xl font-semibold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-all duration-300 hover:scale-110 backdrop-blur-xl"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Errors */}
              {errors.length > 0 && (
                <div className="relative bg-red-500/10 dark:bg-red-500/20 backdrop-blur-xl border border-red-500/20 dark:border-red-500/30 rounded-2xl p-4 shadow-lg shadow-red-500/10">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300 font-medium">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Project Name with Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Project name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full pl-[4.25rem] pr-4 py-4 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 text-base font-medium transition-all duration-200 backdrop-blur-xl shadow-sm"
                    style={{
                      ...(isInputFocused && {
                        borderColor: `${color}80`,
                        boxShadow: `0 0 0 4px ${color}15`,
                      }),
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    autoFocus
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[1.125rem] flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-xl z-10"
                    style={{ 
                      backgroundColor: color,
                      boxShadow: `0 8px 32px ${color}40, inset 0 1px 0 rgba(255,255,255,0.4)`
                    }}
                  >
                    <SelectedIconComponent 
                      className="w-7 h-7" 
                      style={{ 
                        color: '#ffffff',
                        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))',
                        opacity: 1
                      }} 
                    />
                  </button>
                </div>
            
                {/* Icon Picker Dropdown */}
                {showIconPicker && (
                  <div className="mt-3 p-5 bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl shadow-black/10 animate-slide-up">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider">Choose Icon</p>
                    <div className="flex flex-wrap gap-2.5">
                      {PROJECT_ICONS.map((iconOption) => {
                        const IconComp = iconOption.icon;
                        return (
                          <button
                            key={iconOption.name}
                            type="button"
                            onClick={() => {
                              setIcon(iconOption.name);
                              setShowIconPicker(false);
                            }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                              icon === iconOption.name
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 scale-110'
                                : 'bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 border border-black/5 dark:border-white/10 hover:scale-105 backdrop-blur-xl'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Project color
                </label>
                <div className="grid grid-cols-6 gap-3 p-5 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-black/10 dark:border-white/10 shadow-inner">
                  {PROJECT_COLORS.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setColor(colorOption.value)}
                      className={`w-full aspect-square rounded-2xl transition-all duration-300 ${
                        color === colorOption.value
                          ? 'ring-4 ring-offset-2 ring-offset-white/50 dark:ring-offset-black/50 scale-110 shadow-2xl'
                          : 'hover:scale-105 shadow-lg hover:shadow-xl'
                      }`}
                      style={{ 
                        backgroundColor: colorOption.value,
                        boxShadow: color === colorOption.value 
                          ? `0 8px 32px ${colorOption.value}60, 0 0 0 3px ${colorOption.value}40` 
                          : `0 4px 16px ${colorOption.value}30`
                      }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>

              {/* Pin Option */}
              {mode === 'create' && (
                <div className="flex items-center justify-between p-5 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20 backdrop-blur-xl rounded-3xl border border-amber-500/20 dark:border-amber-500/30 shadow-lg shadow-amber-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <FaStar className="w-5 h-5 text-white drop-shadow" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-900 dark:text-white block">
                        Pin to top
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Quick access to this project</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPinned(!isPinned)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                      isPinned 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' 
                        : 'bg-gray-300/50 dark:bg-gray-700/50 backdrop-blur-xl'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
                        isPinned ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Suggestions */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Quick suggestions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Work', icon: MdWork, color: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
                    { name: 'Personal', icon: MdHome, color: '#8B5CF6', gradient: 'from-purple-500 to-purple-600' },
                    { name: 'Study', icon: FaGraduationCap, color: '#10B981', gradient: 'from-green-500 to-green-600' },
                    { name: 'Health', icon: FaHeart, color: '#EF4444', gradient: 'from-red-500 to-red-600' },
                    { name: 'Travel', icon: FaRocket, color: '#F59E0B', gradient: 'from-amber-500 to-amber-600' },
                    { name: 'Finance', icon: FaBriefcase, color: '#06B6D4', gradient: 'from-cyan-500 to-cyan-600' },
                  ].map((tag) => {
                    const TagIcon = tag.icon;
                    return (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => {
                          setTitle(tag.name);
                          setColor(tag.color);
                        }}
                        className="group px-4 py-4 rounded-2xl text-sm font-semibold bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center gap-3"
                        style={{
                          boxShadow: `0 4px 20px ${tag.color}10`
                        }}
                      >
                        <div className={`w-11 h-11 bg-gradient-to-br ${tag.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                          style={{
                            boxShadow: `0 4px 16px ${tag.color}40`
                          }}
                        >
                          <TagIcon className="w-5 h-5 text-white drop-shadow" />
                        </div>
                        <span className="text-gray-800 dark:text-gray-200">{tag.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info Box */}
              <div className="flex gap-4 p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 backdrop-blur-xl border border-blue-500/20 dark:border-blue-500/30 rounded-3xl shadow-lg shadow-blue-500/10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <FaLightbulb className="w-6 h-6 text-white drop-shadow" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1.5">About Projects</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Projects keep notes, files, and settings organized in one place. Use them for ongoing work or to keep things tidy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-2xl text-white transition-all duration-300 font-semibold"
              style={{
                backgroundColor: color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {mode === 'create' ? 'Create Project' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
