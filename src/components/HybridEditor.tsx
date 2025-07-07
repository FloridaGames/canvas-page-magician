import { RichTextEditor } from './RichTextEditor';
import { Label } from '@/components/ui/label';

interface HybridEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inline?: boolean; // Add inline prop
}

export const HybridEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your content...",
  className = "",
  inline = false
}: HybridEditorProps) => {

  if (inline) {
    return (
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        inline={true}
      />
    );
  }

  return (
    <div className={`hybrid-editor ${className}`}>
      <div className="mb-3">
        <Label className="text-base font-medium">
          Visual Editor
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          ContentEditable editor with Canvas LMS preservation - details/summary elements are protected during editing
        </p>
      </div>

      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-h-[500px]"
        inline={false}
      />
    </div>
  );
};