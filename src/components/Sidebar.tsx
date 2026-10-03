import React from 'react';
import { Image as ImageIcon, Search, Users, MapPin, FolderHeart, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedCategory: string | null;
  onCategorySelect: (cat: string | null) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  selectedCategory,
  onCategorySelect,
  className = '',
}) => {
  const navItems = [
    { id: 'photos', label: 'Photos', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'search', label: 'AI Memory Search', icon: <Sparkles className="w-4 h-4 text-blue-600" /> },
    { id: 'people', label: 'People & Pets', icon: <Users className="w-4 h-4" /> },
    { id: 'places', label: 'Places', icon: <MapPin className="w-4 h-4" /> },
    { id: 'albums', label: 'Albums', icon: <FolderHeart className="w-4 h-4" /> },
  ];

  const categories = [
    { id: null, label: 'All Items' },
    { id: 'photo', label: '📷 Photos' },
    { id: 'screenshot', label: '📱 Screenshots' },
    { id: 'document', label: '📄 Documents' },
  ];

  return (
    <aside className={`w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between space-y-6 ${className}`}>
      <div className="space-y-6">
        {/* Navigation Items */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Library
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Media Categories Filter */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Category Filter
          </div>
          <div className="space-y-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id || 'all'}
                  onClick={() => onCategorySelect(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">Lumina Photos MVP</p>
        <p className="text-[11px] text-slate-400">Controlled library (150 visual items)</p>
      </div>
    </aside>
  );
};
