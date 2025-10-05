
import React from 'react';
import { HEADER_LINKS } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="bg-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
             <img src="https://cdn2.iconfinder.com/data/icons/geography-flat-2/64/gis-layer-process-present-analysis-positioning-overlay-512.png" alt="GIS Platform Logo" className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-800">AI-Driven GIS Platform</span>
          </div>
          <nav className="hidden md:flex space-x-4">
            {HEADER_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;