import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useState, useEffect, useMemo } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your content...",
  className = ""
}: RichTextEditorProps) => {
  
  // Store both the raw HTML and the Quill-safe version
  const [rawHtml, setRawHtml] = useState(value);
  const [quillValue, setQuillValue] = useState(value);

  // Update internal state when external value changes
  useEffect(() => {
    setRawHtml(value);
    setQuillValue(value);
  }, [value]);

  // Preserve Canvas LMS elements by storing them separately
  const preserveCanvasElements = (html: string) => {
    // Store details/summary and other Canvas elements
    const detailsRegex = /<details[^>]*>[\s\S]*?<\/details>/gi;
    const canvasElements = html.match(detailsRegex) || [];
    
    // Replace with placeholders for Quill
    let processedHtml = html;
    canvasElements.forEach((element, index) => {
      processedHtml = processedHtml.replace(element, `[CANVAS_ELEMENT_${index}]`);
    });
    
    return { processedHtml, canvasElements };
  };

  // Restore Canvas LMS elements
  const restoreCanvasElements = (html: string, canvasElements: string[]) => {
    let restoredHtml = html;
    canvasElements.forEach((element, index) => {
      restoredHtml = restoredHtml.replace(`[CANVAS_ELEMENT_${index}]`, element);
    });
    return restoredHtml;
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align', 'color', 'background',
    'code', 'code-block'
  ];

  const handleChange = (content: string) => {
    // Check if we have Canvas elements preserved
    const { canvasElements } = preserveCanvasElements(rawHtml);
    
    // If we have Canvas elements, restore them in the output
    const finalContent = canvasElements.length > 0 
      ? restoreCanvasElements(content, canvasElements)
      : content;
    
    setQuillValue(content);
    setRawHtml(finalContent);
    onChange(finalContent);
  };

  // Process the value for Quill display
  const getQuillDisplayValue = () => {
    const { processedHtml } = preserveCanvasElements(rawHtml);
    return processedHtml;
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={getQuillDisplayValue()}
        onChange={handleChange}
        placeholder={placeholder}
        formats={formats}
        modules={modules}
        style={{
          minHeight: '300px'
        }}
      />
      
      {/* Debug info - show if Canvas elements are preserved */}
      {rawHtml.includes('<details') && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          Canvas LMS elements (details/summary) are preserved in the output
        </div>
      )}
    </div>
  );
};