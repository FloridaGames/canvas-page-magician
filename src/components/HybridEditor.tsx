import { RichTextEditor } from './RichTextEditor';
import { Label } from '@/components/ui/label';

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

  return (
    <div className={`hybrid-editor ${className}`}>
      <div className="mb-3">
        <Label className="text-base font-medium">
          Visual Editor
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          TinyMCE editor with full Canvas LMS support - edit inline with live preview
        </p>
      </div>

      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-h-[500px]"
      />
    </div>
  );
};