import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Declare TinyMCE on window object
declare global {
  interface Window {
    tinymce: any;
  }
}

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
  const [apiKey, setApiKey] = useState<string>('1avqv4zyipvso9ezpkpsyih9sgpwjuq5ysly1r9mopfqmvoi');
  const [isLoading, setIsLoading] = useState(false);

  // Load TinyMCE script directly from CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.tiny.cloud/1/1avqv4zyipvso9ezpkpsyih9sgpwjuq5ysly1r9mopfqmvoi/tinymce/6/tinymce.min.js';
    script.referrerPolicy = 'origin';
    document.head.appendChild(script);

    script.onload = () => {
      setIsLoading(false);
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize TinyMCE directly
  useEffect(() => {
    if (!window.tinymce || !editorRef.current) return;

    const editorId = `editor-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create textarea element
    const textarea = document.createElement('textarea');
    textarea.id = editorId;
    textarea.value = value;
    editorRef.current.appendChild(textarea);

    window.tinymce.init({
      selector: `#${editorId}`,
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
      valid_elements: '*[*]',
      valid_children: '+body[style],+details[summary],+summary[*]',
      extended_valid_elements: 'details[open|class|style|id],summary[class|style|id]',
      verify_html: false,
      cleanup: false,
      convert_urls: false,
      preserve_whitespace: true,
      allow_unsafe_link_target: true,
      setup: (editor: any) => {
        editor.on('init', () => {
          // Set initial content when editor is ready
          editor.setContent(value || '');
        });
        
        editor.on('change keyup', () => {
          onChange(editor.getContent());
        });
      }
    });

    return () => {
      if (window.tinymce) {
        window.tinymce.remove(`#${editorId}`);
      }
    };
  }, [value, onChange]);

  return (
    <div className={`rich-text-editor ${className}`}>
      <div ref={editorRef} className="min-h-[500px]" />
    </div>
  );
};