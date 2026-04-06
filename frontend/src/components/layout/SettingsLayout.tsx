import React from 'react';
import { Outlet } from 'react-router-dom';

const SettingsLayout: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <Outlet />
    </div>
  );
};

export default SettingsLayout;
