import { useState, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Eye, Code2, AlertTriangle } from 'lucide-react';

interface HybridEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const HybridEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your content...",
  className = ""
}: HybridEditorProps) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [hasComplexHtml, setHasComplexHtml] = useState(false);

  // Detect complex HTML elements that might be lost in rich text editor
  const detectComplexHtml = (html: string) => {
    const complexElements = [
      '<details', '<summary', '<div class=', '<div style=', 
      'data-api-', 'class="content-box"', 'style="display: flex'
    ];
    
    return complexElements.some(element => html.includes(element));
  };

  useEffect(() => {
    setHasComplexHtml(detectComplexHtml(value));
  }, [value]);

  // Auto-switch to HTML mode if very complex elements are detected (TinyMCE handles most cases)
  useEffect(() => {
    if (hasComplexHtml && !isHtmlMode && value.includes('data-api-')) {
      // Only auto-switch for very complex Canvas API elements
      setIsHtmlMode(true);
    }
  }, [hasComplexHtml]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setHasComplexHtml(detectComplexHtml(newValue));
  };

  return (
    <div className={`hybrid-editor ${className}`}>
      {hasComplexHtml && value.includes('data-api-') && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This page contains advanced Canvas API elements. 
            We've switched to HTML mode to preserve the original layout.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-3">
        <Label>
          {isHtmlMode ? "HTML Source Editor" : "Visual Editor"}
        </Label>
        
        <div className="flex gap-2">
          <Button
            variant={!isHtmlMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsHtmlMode(false)}
            disabled={hasComplexHtml && value.includes('data-api-')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Visual
          </Button>
          <Button
            variant={isHtmlMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsHtmlMode(true)}
          >
            <Code2 className="h-4 w-4 mr-1" />
            HTML
          </Button>
        </div>
      </div>

      {isHtmlMode ? (
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[500px] p-4 font-mono text-sm border border-border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '13px',
              lineHeight: '1.4'
            }}
          />
          <p className="text-sm text-muted-foreground">
            Edit the HTML source directly. All Canvas elements and styling will be preserved.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <RichTextEditor
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="min-h-[500px]"
          />
            <p className="text-sm text-muted-foreground">
              TinyMCE editor with full Canvas LMS support - preserves collapsible boxes and custom styling.
            </p>
        </div>
      )}

      {/* Live Preview */}
      {value && (
        <div className="mt-6">
          <Label className="text-base font-medium">Live Preview</Label>
          <div 
            className="mt-2 p-4 bg-editor-bg rounded-lg border min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: value }}
          />
          <p className="text-sm text-muted-foreground mt-2">
            This is how your content will appear in Canvas.
          </p>
        </div>
      )}
    </div>
  );
};