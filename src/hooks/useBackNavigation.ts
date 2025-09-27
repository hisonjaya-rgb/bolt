import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationHistoryItem {
  pathname: string;
  search: string;
  timestamp: number;
}

export function useBackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = useCallback(() => {
    const historyKey = "app_navigation_history";
    
    try {
      // Get stored navigation history
      const storedHistory = sessionStorage.getItem(historyKey);
      const history: NavigationHistoryItem[] = storedHistory 
        ? JSON.parse(storedHistory) 
        : [];

      // Remove the current page from history (as it's the page we're leaving)
      const updatedHistory = history.filter(item => 
        item.pathname !== location.pathname || item.search !== location.search
      );

      // Get the previous page
      const previousPage = updatedHistory[updatedHistory.length - 1];
      
      if (previousPage) {
        // Navigate to the previous page and update history
        sessionStorage.setItem(historyKey, JSON.stringify(updatedHistory.slice(0, -1)));
        navigate(previousPage.pathname + previousPage.search);
      } else {
        // No history available, navigate to dashboard
        navigate("/");
      }
    } catch (error) {
      console.error("Error in back navigation:", error);
      // Fallback to dashboard
      navigate("/");
    }
  }, [navigate, location]);

  const pushToHistory = useCallback(() => {
    const historyKey = "app_navigation_history";
    
    try {
      const storedHistory = sessionStorage.getItem(historyKey);
      const history: NavigationHistoryItem[] = storedHistory 
        ? JSON.parse(storedHistory) 
        : [];

      // Don't add the same page twice in a row
      const lastItem = history[history.length - 1];
      const currentPath = location.pathname + location.search;
      const lastPath = lastItem ? lastItem.pathname + lastItem.search : null;

      if (currentPath !== lastPath) {
        const newHistoryItem: NavigationHistoryItem = {
          pathname: location.pathname,
          search: location.search,
          timestamp: Date.now()
        };

        const updatedHistory = [...history, newHistoryItem];
        
        // Keep only the last 10 pages in history to avoid memory issues
        const trimmedHistory = updatedHistory.slice(-10);
        
        sessionStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error("Error storing navigation history:", error);
    }
  }, [location]);

  return {
    goBack,
    pushToHistory
  };
}
