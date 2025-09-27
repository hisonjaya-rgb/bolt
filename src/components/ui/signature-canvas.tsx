import { useRef, useImperativeHandle, forwardRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "./button";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
  value?: string;
  onSave?: (signature: string) => void;
  placeholder?: string;
  readonly?: boolean;
  className?: string;
}

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

export const CustomSignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ value, onSave, placeholder = "Tap to Sign", readonly = false, className }, ref) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [hasSignature, setHasSignature] = useState(!!value);
    const [isDrawing, setIsDrawing] = useState(false);

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigCanvas.current?.clear();
        setHasSignature(false);
      },
      isEmpty: () => {
        return sigCanvas.current?.isEmpty() ?? true;
      },
      toDataURL: () => {
        return sigCanvas.current?.toDataURL() ?? "";
      },
    }));

    const handleClear = () => {
      sigCanvas.current?.clear();
      setHasSignature(false);
    };

    const handleDone = () => {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        const signatureData = sigCanvas.current.toDataURL();
        setHasSignature(true);
        onSave?.(signatureData);
      }
    };

    const handleBegin = () => {
      setIsDrawing(true);
    };

    const handleEnd = () => {
      setIsDrawing(false);
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        setHasSignature(true);
      }
    };

    if (readonly && value) {
      return (
        <div className={cn("relative border border-input rounded-lg overflow-hidden", className)}>
          <img 
            src={value} 
            alt="Signature" 
            className="w-full h-32 object-contain bg-background"
          />
        </div>
      );
    }

    return (
      <div className={cn("relative", className)}>
        {/* Control buttons */}
        <div className="flex justify-between items-center mb-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleDone}
            disabled={!hasSignature && !isDrawing}
            className="bg-primary hover:bg-primary/90"
          >
            Done
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="p-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Signature canvas */}
        <div className="relative border border-input rounded-lg overflow-hidden bg-background">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 400,
              height: 128,
              className: "signature-canvas w-full h-32 cursor-crosshair",
              style: { touchAction: 'none' }
            }}
            backgroundColor="rgb(255, 255, 255)"
            penColor="rgb(0, 0, 0)"
            onBegin={handleBegin}
            onEnd={handleEnd}
            velocityFilterWeight={0.7}
            minWidth={1}
            maxWidth={2}
            dotSize={1}
          />
          
          {/* Placeholder text */}
          {!hasSignature && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">{placeholder}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CustomSignatureCanvas.displayName = "CustomSignatureCanvas";