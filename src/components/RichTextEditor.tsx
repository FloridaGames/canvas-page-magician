import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Paragraph,
  Heading,
  BlockQuote,
  CodeBlock,
  List,
  Alignment,
  Font,
  Highlight,
  Indent,
  IndentBlock,
  Table,
  TableToolbar,
  HorizontalLine,
  SourceEditing,
  GeneralHtmlSupport,
  Essentials,
  Autoformat,
  AutoLink,
  Clipboard,
  Enter,
  SelectAll,
  ShiftEnter,
  Typing,
  Undo
} from 'ckeditor5';

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
  
  const editorConfiguration = {
    plugins: [
      Essentials,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      Code,
      Font,
      Highlight,
      Paragraph,
      Heading,
      BlockQuote,
      CodeBlock,
      List,
      Link,
      Alignment,
      Indent,
      IndentBlock,
      Table,
      TableToolbar,
      HorizontalLine,
      SourceEditing,
      GeneralHtmlSupport,
      Autoformat,
      AutoLink,
      Clipboard,
      Enter,
      SelectAll,
      ShiftEnter,
      Typing,
      Undo
    ],
    toolbar: [
      'undo', 'redo',
      '|',
      'sourceEditing',
      '|',
      'heading',
      '|',
      'bold', 'italic', 'underline', 'strikethrough', 'code',
      '|',
      'fontSize', 'fontColor', 'fontBackgroundColor', 'highlight',
      '|',
      'alignment',
      '|',
      'numberedList', 'bulletedList',
      'outdent', 'indent',
      '|',
      'link', 'insertTable',
      '|',
      'blockQuote', 'codeBlock', 'horizontalLine'
    ],
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells'
      ]
    },
    // General HTML Support - preserves Canvas LMS HTML elements
    htmlSupport: {
      allow: [
        {
          name: /.*/,
          attributes: /.*/, 
          classes: /.*/,
          styles: /.*/
        }
      ]
    },
    placeholder
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <CKEditor
        editor={ClassicEditor}
        config={editorConfiguration}
        data={value}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        onReady={(editor) => {
          console.log('CKEditor 5 is ready for Canvas LMS content.');
        }}
        onError={(error) => {
          console.error('CKEditor error:', error);
        }}
      />
    </div>
  );
};