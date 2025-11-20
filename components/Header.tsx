
import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
    onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="w-full py-6 px-6 fixed top-0 z-50 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-end">
         <button 
            onClick={onOpenSettings}
            className="pointer-events-auto p-2.5 rounded-full bg-neutral-900/50 backdrop-blur border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all shadow-lg group"
            title="Settings"
         >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
         </button>
      </div>
    </header>
  );
};
