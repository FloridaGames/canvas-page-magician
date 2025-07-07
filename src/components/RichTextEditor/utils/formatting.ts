// Formatting utilities for the rich text editor
export const execCommand = (command: string, value?: string, editorRef?: React.RefObject<HTMLDivElement>, onInput?: () => void) => {
  document.execCommand(command, false, value);
  editorRef?.current?.focus();
  onInput?.();
};

export const insertBlockquote = (onInput?: () => void) => {
  const blockquote = document.createElement('blockquote');
  blockquote.innerHTML = window.getSelection()?.toString() || 'Quote text';
  blockquote.style.borderLeft = '4px solid #ccc';
  blockquote.style.paddingLeft = '1rem';
  blockquote.style.margin = '1rem 0';
  document.execCommand('insertHTML', false, blockquote.outerHTML);
  onInput?.();
};

export const insertCode = (onInput?: () => void) => {
  const code = document.createElement('code');
  code.innerHTML = window.getSelection()?.toString() || 'code';
  code.style.backgroundColor = '#f4f4f4';
  code.style.padding = '2px 4px';
  code.style.borderRadius = '3px';
  document.execCommand('insertHTML', false, code.outerHTML);
  onInput?.();
};

export const insertLink = (editorRef?: React.RefObject<HTMLDivElement>, onInput?: () => void) => {
  const url = window.prompt('Enter URL:');
  if (url) {
    execCommand('createLink', url, editorRef, onInput);
  }
};

export const insertImage = (editorRef?: React.RefObject<HTMLDivElement>, onInput?: () => void) => {
  const url = window.prompt('Enter image URL:');
  if (url) {
    execCommand('insertImage', url, editorRef, onInput);
  }
};

export const editHTML = (editorRef?: React.RefObject<HTMLDivElement>, onInput?: () => void) => {
  if (editorRef?.current) {
    const html = editorRef.current.innerHTML;
    const newHtml = window.prompt('Edit HTML:', html);
    if (newHtml !== null) {
      editorRef.current.innerHTML = newHtml;
      onInput?.();
    }
  }
};