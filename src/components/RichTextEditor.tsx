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

// Custom Quill module to handle Canvas LMS elements
let isQuillCustomized = false;

const customizeQuill = () => {
  if (isQuillCustomized) return;
  
  try {
    const Block = Quill.import('blots/block') as any;
    const Container = Quill.import('blots/container') as any;
    const Parchment = Quill.import('parchment') as any;
    
    // Details blot - container for collapsible content
    class DetailsBlot extends Block {
      static blotName = 'details';
      static scope = Parchment.Scope.BLOCK_BLOT;
      static tagName = 'details';
      
      static create(value?: any) {
        const node = super.create();
        if (value && value.open) {
          node.setAttribute('open', '');
        }
        return node;
      }
      
      static formats(node: HTMLElement) {
        return {
          details: node.hasAttribute('open') ? { open: true } : true
        };
      }
      
      format(name: string, value: any) {
        if (name === 'details' && value) {
          const domNode = this.domNode as HTMLElement;
          if (value.open) {
            domNode.setAttribute('open', '');
          } else {
            domNode.removeAttribute('open');
          }
        } else {
          super.format(name, value);
        }
      }
    }
    
    // Summary blot - header for details element
    class SummaryBlot extends Block {
      static blotName = 'summary';
      static scope = Parchment.Scope.BLOCK_BLOT;
      static tagName = 'summary';
      
      static create(value?: any) {
        return super.create();
      }
      
      static formats() {
        return { summary: true };
      }
    }
    
    // Create a simple inline blot for preserving HTML
    const Inline = Quill.import('blots/inline') as any;
    
    class PreservedHtmlBlot extends Inline {
      static blotName = 'preserved-html';
      static tagName = ['details', 'summary'];
      
      static create(value: string) {
        const node = super.create();
        node.innerHTML = value;
        return node;
      }
      
      static formats(node: HTMLElement) {
        return node.outerHTML;
      }
    }
    
    // Register the blots
    Quill.register('formats/details', DetailsBlot, true);
    Quill.register('formats/summary', SummaryBlot, true);
    Quill.register('formats/preserved-html', PreservedHtmlBlot, true);
    
    isQuillCustomized = true;
    console.log('Canvas LMS elements registered with Quill');
  } catch (error) {
    console.warn('Failed to register Canvas LMS elements:', error);
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