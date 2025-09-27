import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MobileFormWrapperProps {
  children: React.ReactNode;
  className?: string;
  autoScrollOnFocus?: boolean;
}

export function MobileFormWrapper({ 
  children, 
  className, 
  autoScrollOnFocus = true 
}: MobileFormWrapperProps) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScrollOnFocus) return;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the focused element is a form input
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.hasAttribute('contenteditable')
      ) {
        // Small delay to ensure keyboard is fully opened
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    };

    const formElement = formRef.current;
    if (formElement) {
      formElement.addEventListener('focusin', handleFocusIn);
      
      return () => {
        formElement.removeEventListener('focusin', handleFocusIn);
      };
    }
  }, [autoScrollOnFocus]);

  return (
    <div 
      ref={formRef}
      className={cn(
        "w-full",
        // Add padding bottom for mobile keyboards
        "pb-safe-area-inset-bottom",
        className
      )}
    >
      {children}
    </div>
  );
}