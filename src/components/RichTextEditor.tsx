import { MenuBar } from './RichTextEditor/MenuBar';
import { useRichTextEditor } from './RichTextEditor/hooks/useRichTextEditor';
import { CollapsibleControls } from './RichTextEditor/CollapsibleControls';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inline?: boolean;
  courseId?: string;
  courseDomain?: string;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your content...",
  className = "",
  inline = false,
  courseId,
  courseDomain
}: RichTextEditorProps) => {
  const {
    editorRef,
    showToolbar,
    handleInput,
    handleFocus,
    handleBlur,
    handleSelection,
    handlePaste,
    collapsibleControls,
  } = useRichTextEditor({ value, onChange, inline, courseId, courseDomain });

  return (
    <div className={`rich-text-editor ${inline ? 'relative' : 'border border-border rounded-lg overflow-hidden bg-background'} ${className}`}>
      {showToolbar && (
        <div className={inline ? 'absolute top-0 left-0 z-50 bg-background border border-border rounded-lg shadow-lg' : ''}>
          <MenuBar editorRef={editorRef} onInput={handleInput} />
        </div>
      )}
      <div 
        ref={editorRef}
        contentEditable
        className={`${inline ? 'min-h-[2rem] p-2' : 'min-h-[300px] p-4'} text-foreground focus:outline-none prose prose-sm max-w-none [&_details]:border [&_details]:border-border [&_details]:rounded [&_details]:p-2 [&_details]:my-2 [&_summary]:font-medium [&_summary]:cursor-pointer [&_summary]:mb-2 [&_iframe]:cursor-pointer [&_iframe]:border [&_iframe]:border-border [&_iframe]:rounded [&_iframe]:pointer-events-auto empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none ${inline ? 'hover:bg-muted/10 focus:bg-muted/20 rounded transition-colors' : ''}`}
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        suppressContentEditableWarning={true}
        data-placeholder={!value ? placeholder : undefined}
        style={{
          minHeight: inline ? '2rem' : '300px',
        }}
      />
      
      {/* Collapsible Controls */}
      {collapsibleControls.showControls && !inline && (
        <div className="collapsible-controls">
          <CollapsibleControls
            onDuplicate={collapsibleControls.handleDuplicate}
            onAddBelow={collapsibleControls.handleAddBelow}
            onRemove={collapsibleControls.handleRemove}
            position={collapsibleControls.controlsPosition}
          />
        </div>
      )}
      
      {/* Debug info */}
      {value && value.includes('<details') && !inline && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✓ Canvas LMS details/summary elements detected and preserved - Click on sections to duplicate, add, or remove
        </div>
      )}

    </div>
  );
};