import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Quote
} from 'lucide-react';
import { execCommand, insertBlockquote, insertCode, insertLink, insertImage, editHTML } from './utils/formatting';

interface MenuBarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onInput: () => void;
}

export const MenuBar = ({ editorRef, onInput }: MenuBarProps) => {
  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => execCommand('bold', undefined, editorRef, onInput)}
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => execCommand('italic', undefined, editorRef, onInput)}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => execCommand('underline', undefined, editorRef, onInput)}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => execCommand('justifyLeft', undefined, editorRef, onInput)}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => execCommand('justifyCenter', undefined, editorRef, onInput)}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => execCommand('justifyRight', undefined, editorRef, onInput)}
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => execCommand('insertUnorderedList', undefined, editorRef, onInput)}
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => execCommand('insertOrderedList', undefined, editorRef, onInput)}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertBlockquote(onInput)}
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertCode(onInput)}
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertLink(editorRef, onInput)}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertImage(editorRef, onInput)}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>


      <div className="ml-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editHTML(editorRef, onInput)}
        >
          HTML
        </Button>
      </div>
    </div>
  );
};