import { useState, useEffect } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed.toString());
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  return {
    isCollapsed,
    toggleSidebar
  };
};

