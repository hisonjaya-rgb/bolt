import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload, Bot, User, Paperclip, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  fileAttachment?: {
    name: string;
    type: string;
    size: number;
  };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        toast({
          title: "File Selected",
          description: `${file.name} ready to upload`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV, Excel, or PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim() || "Uploaded file for processing",
      role: "user",
      timestamp: new Date(),
      fileAttachment: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let fileData = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        // Convert file to base64 for sending to edge function
        const reader = new FileReader();
        const fileDataPromise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove data:mime;base64, prefix
          };
        });
        reader.readAsDataURL(selectedFile);
        fileData = await fileDataPromise;
      }

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: input.trim(),
          fileData: fileData,
          fileName: selectedFile?.name,
          fileType: selectedFile?.type,
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.dataInserted) {
        toast({
          title: "Data Processed",
          description: "File data has been parsed and inserted into the database",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about your garment production data or upload files for processing
        </p>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 mb-4 border-border">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 text-primary/50" />
              <h3 className="text-lg font-medium mb-2">Welcome to AI Assistant</h3>
              <p className="text-sm max-w-md">
                Ask questions about your vendors, articles, BOM, QC reports, or shipping data. 
                You can also upload CSV, Excel, or PDF files for processing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted text-foreground mr-4'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {message.role === 'assistant' ? (
                        <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {message.fileAttachment && (
                      <div className="flex items-center gap-2 p-2 bg-background/10 rounded-lg mb-2">
                        <Paperclip className="h-3 w-3" />
                        <span className="text-xs">{message.fileAttachment.name}</span>
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Input Area */}
      <Card className="p-4 border-border">
        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-3">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="ml-auto h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
            disabled={isLoading}
          >
            <Upload className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your production data or upload a file..."
              className="min-h-[2.5rem] max-h-32 resize-none border-input"
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={(!input.trim() && !selectedFile) || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}