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
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
    'list', 'bullet', 'indent', 'align',
    'link', 'image', 'video', 'code-block'
  ];

  // Custom styles for the editor
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ql-editor {
        min-height: 300px;
        font-size: 14px;
        line-height: 1.6;
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
      />
    </div>
  );
};