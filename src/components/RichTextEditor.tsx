import { useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

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
  const editorRef = useRef<any>(null);

  // TinyMCE configuration optimized for Canvas LMS HTML
  const editorConfig = {
    height: 500,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample'
    ],
    toolbar: [
      'undo redo | blocks | bold italic underline strikethrough | fontsize forecolor backcolor',
      'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
      'removeformat | link image media table | code codesample | help'
    ].join(' | '),
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
        font-size: 14px; 
        line-height: 1.6; 
        color: hsl(var(--foreground));
        background-color: hsl(var(--background));
      }
      details {
        border: 1px solid #C3C3C3;
        margin: 0 0 10px 0;
        background-color: #ffffff;
        border-radius: 4px;
      }
      summary {
        padding: 10px;
        cursor: pointer;
        font-weight: bold;
        background-color: #f8f9fa;
        border-bottom: 1px solid #C3C3C3;
      }
      summary:hover {
        background-color: #e9ecef;
      }
      .content-box {
        padding: 10px;
        border: 1px solid #ddd;
        margin: 10px 0;
        border-radius: 4px;
      }
    `,
    // Preserve all HTML elements including Canvas-specific ones
    valid_elements: '*[*]',
    valid_children: '+body[style],+details[summary],+summary[*]',
    extended_valid_elements: 'details[open|class|style|id],summary[class|style|id]',
    // Don't remove any elements or attributes
    verify_html: false,
    cleanup: false,
    convert_urls: false,
    // Preserve whitespace and formatting
    preserve_whitespace: true,
    // Allow all styles and attributes
    allow_unsafe_link_target: true,
    // Custom setup to preserve Canvas elements
    setup: (editor: any) => {
      editor.on('BeforeSetContent', (e: any) => {
        // Preserve all HTML as-is, especially Canvas elements
        if (e.content && (e.content.includes('<details') || e.content.includes('<summary'))) {
          e.content = e.content;
        }
      });
    },
    // Use API key from environment
    apiKey: 'no-api-key' // Will be replaced with actual key
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <Editor
        apiKey="no-api-key"
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={editorConfig}
      />
    </div>
  );
};