
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-200 mt-12">
      <div className="container mx-auto py-4 px-5 text-center">
        <p className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} AI-Driven GIS Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;