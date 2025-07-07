import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const quillRef = useRef<ReactQuill>(null);

  // Custom toolbar configuration for Canvas pages
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, 
       { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['code-block'],
      ['clean']
    ],
    clipboard: {
      // Preserve all HTML content including custom elements
      matchVisual: false,
    }
  };

  // Expanded formats to preserve more HTML elements
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
    'list', 'bullet', 'indent', 'align',
    'link', 'image', 'video', 'code-block',
    'div', 'details', 'summary', 'style', 'class', 'id'
  ];

  // Custom HTML handling to preserve Canvas-specific elements
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      // Override the clipboard module to preserve custom HTML
      const originalConvert = quill.clipboard.convert;
      quill.clipboard.convert = function(html: string) {
        // Store original HTML if it contains details/summary elements
        if (html.includes('<details') || html.includes('<summary')) {
          // Return the HTML as-is for Canvas-specific elements
          const delta = originalConvert.call(this, html);
          return delta;
        }
        return originalConvert.call(this, html);
      };

      // Preserve HTML content on paste
      quill.root.addEventListener('paste', (e) => {
        e.preventDefault();
        const clipboardData = e.clipboardData || (window as any).clipboardData;
        const pastedData = clipboardData.getData('text/html') || clipboardData.getData('text/plain');
        
        if (pastedData.includes('<details') || pastedData.includes('<summary')) {
          // Insert HTML directly for Canvas elements
          const range = quill.getSelection();
          if (range) {
            quill.clipboard.dangerouslyPasteHTML(range.index, pastedData);
          }
        } else {
          // Use normal paste handling
          quill.clipboard.dangerouslyPasteHTML(pastedData);
        }
      });
    }
  }, []);

  // Custom styles for the editor
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ql-editor {
        min-height: 300px;
        font-size: 14px;
        line-height: 1.6;
      }
      .ql-editor details {
        border: 1px solid #C3C3C3;
        margin: 0 0 10px 0;
        background-color: #ffffff;
      }
      .ql-editor summary {
        padding: 10px;
        cursor: pointer;
        font-weight: bold;
      }
      .ql-editor summary:hover {
        background-color: #f5f5f5;
      }
      .ql-toolbar {
        border-top: 1px solid hsl(var(--border));
        border-left: 1px solid hsl(var(--border));
        border-right: 1px solid hsl(var(--border));
      }
      .ql-container {
        border-bottom: 1px solid hsl(var(--border));
        border-left: 1px solid hsl(var(--border));
        border-right: 1px solid hsl(var(--border));
      }
      .ql-editor.ql-blank::before {
        color: hsl(var(--muted-foreground));
        font-style: normal;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        preserveWhitespace={true}
      />
    </div>
  );
};