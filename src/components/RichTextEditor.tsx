import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

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

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <Editor
        apiKey="no-api-key" // Using TinyMCE without cloud - loads from CDN
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | code | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          placeholder: placeholder,
          // Preserve all HTML including custom elements
          verify_html: false,
          cleanup: false,
          convert_urls: false,
          remove_script_host: false,
          relative_urls: false,
          // Allow all HTML elements and attributes
          valid_elements: '*[*]',
          valid_children: '+body[style]',
          extended_valid_elements: 'details[open|style|class],summary[style|class]',
          // Preserve custom elements on paste
          paste_data_images: true,
          paste_retain_style_properties: "all",
          paste_merge_formats: false,
          // Code view for direct HTML editing
          setup: (editor: any) => {
            editor.ui.registry.addButton('sourceCode', {
              text: 'HTML',
              tooltip: 'View/Edit HTML Source',
              onAction: () => {
                const content = editor.getContent();
                const newContent = prompt('Edit HTML:', content);
                if (newContent !== null) {
                  editor.setContent(newContent);
                }
              }
            });
          }
        }}
      />
      
      {/* Debug info */}
      {value.includes('<details') && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✓ Canvas LMS details/summary elements detected and preserved
        </div>
      )}
    </div>
  );
};