import ReactQuill from 'react-quill';
import Quill from 'quill';
import 'react-quill/dist/quill.snow.css';
import { useMemo, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Custom Quill module to handle Canvas LMS elements using Parchment
let isQuillCustomized = false;

const customizeQuill = () => {
  if (isQuillCustomized) return;
  
  try {
    const Block = Quill.import('blots/block') as any;
    const Parchment = Quill.import('parchment') as any;
    
    // Details blot - block-level collapsible container
    class DetailsBlot extends Block {
      static blotName = 'details';
      static tagName = 'details';
      static scope = Parchment.Scope.BLOCK_BLOT;
      
      static create(value?: any) {
        const node = super.create();
        if (value && typeof value === 'object' && value.open) {
          node.setAttribute('open', '');
        }
        return node;
      }
      
      static formats(node: HTMLElement) {
        return node.hasAttribute('open') ? { open: true } : true;
      }
      
      format(name: string, value: any) {
        if (name === 'details' && value) {
          const domNode = this.domNode as HTMLElement;
          if (typeof value === 'object' && value.open) {
            domNode.setAttribute('open', '');
          } else if (value === true) {
            // Keep existing state if just applying format
          } else {
            domNode.removeAttribute('open');
          }
        } else {
          super.format(name, value);
        }
      }
    }
    
    // Summary blot - header/title for details element
    class SummaryBlot extends Block {
      static blotName = 'summary';
      static tagName = 'summary';
      static scope = Parchment.Scope.BLOCK_BLOT;
      
      static create() {
        return super.create();
      }
      
      static formats() {
        return true;
      }
    }
    
    // Register the blots with Quill using the proper path syntax
    Quill.register('formats/details', DetailsBlot, true);
    Quill.register('formats/summary', SummaryBlot, true);
    
    isQuillCustomized = true;
    console.log('Details and Summary blots registered with Quill using Parchment');
  } catch (error) {
    console.warn('Failed to register Details/Summary blots:', error);
  }
};

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your content...",
  className = ""
}: RichTextEditorProps) => {
  
  const quillRef = useRef<ReactQuill>(null);
  
  // Customize Quill on component mount
  useEffect(() => {
    customizeQuill();
  }, []);
  
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
      matchVisual: false,
      matchers: [
        // Custom matcher for details elements
        ['details', (node: HTMLElement, delta: any) => {
          const isOpen = node.hasAttribute('open');
          return delta.insert('\n', { details: { open: isOpen } });
        }],
        // Custom matcher for summary elements  
        ['summary', (node: HTMLElement, delta: any) => {
          return delta.insert(node.textContent || '', { summary: true });
        }]
      ]
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align', 'color', 'background',
    'code', 'code-block',
    'details', 'summary' // Add our custom formats
  ];

  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        formats={formats}
        modules={modules}
        style={{
          minHeight: '300px'
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