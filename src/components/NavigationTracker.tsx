import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBackNavigation } from '@/hooks/useBackNavigation';

export function NavigationTracker() {
  const location = useLocation();
  const { pushToHistory } = useBackNavigation();

  useEffect(() => {
    // Track navigation changes
    pushToHistory();
  }, [location, pushToHistory]);

  return null;
}