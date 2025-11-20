import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-6 fixed top-0 z-50 pointer-events-none">
      {/* Minimalist spacer - Branding removed as requested */}
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Empty container to maintain layout spacing if needed later, currently transparent/invisible */}
      </div>
    </header>
  );
};