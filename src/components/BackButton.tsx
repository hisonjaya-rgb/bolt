import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface BackButtonProps {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  fallbackPath?: string;
}

export function BackButton({ 
  className, 
  variant = "ghost", 
  size = "sm",
  fallbackPath = "/"
}: BackButtonProps) {
  const { goBack } = useBackNavigation();

  const handleBack = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      goBack();
    } else {
      // Fallback to default path if no history
      window.location.href = fallbackPath;
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleBack}
      className={className}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back
    </Button>
  );
}