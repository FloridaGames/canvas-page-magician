import { useRef, useEffect, useCallback, useState } from 'react';

interface UseRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  inline: boolean;
  courseId?: string;
  courseDomain?: string;
  onPendingUploadsChange?: (hasPending: boolean) => void;
}

export const useRichTextEditor = ({ value, onChange, inline, courseId, courseDomain, onPendingUploadsChange }: UseRichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(!inline);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);

  // Update editor content when value changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange]);

  // Handle focus to show toolbar in inline mode and capture current styling
  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (inline) {
      setShowToolbar(true);
      
      // Capture current element's styling and apply to new content
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const currentElement = range.startContainer.nodeType === Node.TEXT_NODE 
          ? range.startContainer.parentElement 
          : range.startContainer as HTMLElement;
        
        if (currentElement && currentElement !== editorRef.current) {
          // Apply the current element's styling to the editor
          const computedStyle = window.getComputedStyle(currentElement);
          if (editorRef.current) {
            editorRef.current.style.fontFamily = computedStyle.fontFamily;
            editorRef.current.style.fontSize = computedStyle.fontSize;
            editorRef.current.style.fontWeight = computedStyle.fontWeight;
            editorRef.current.style.color = computedStyle.color;
            editorRef.current.style.fontStyle = computedStyle.fontStyle;
            editorRef.current.style.textDecoration = computedStyle.textDecoration;
          }
        }
      }
    }
  }, [inline]);

  // Handle blur to hide toolbar in inline mode
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (inline && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowToolbar(false);
    }
  }, [inline]);

  // Handle selection change to position floating toolbar
  const handleSelection = useCallback(() => {
    if (inline && window.getSelection()?.toString()) {
      setShowToolbar(true);
    }
  }, [inline]);

  // Handle paste to preserve formatting
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text);
    handleInput();
  }, [handleInput]);

  // Handle image selection
  const handleImageClick = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove previous selection
      if (selectedImage) {
        selectedImage.style.outline = '';
        selectedImage.style.cursor = '';
      }
      
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      
      // Add visual selection indicator
      img.style.outline = '2px solid #3b82f6';
      img.style.cursor = 'pointer';
      
      // Show upload dialog
      setShowImageUploader(true);
    }
  }, [selectedImage]);

  // Handle image replacement
  const handleImageUploaded = useCallback((newImageUrl: string, fileId: string, fileName: string, apiEndpoint?: string) => {
    // Always decrement pending uploads counter, even on error
    setPendingUploads(prev => Math.max(0, prev - 1));
    
    // If empty values are passed, it indicates an error - just return after decrementing
    if (!newImageUrl || !fileId || !fileName) {
      return;
    }
    
    if (selectedImage && editorRef.current) {
      // Create the Canvas-specific HTML structure with grid-row wrapper
      // This matches the Canvas LMS structure for proper display
      const canvasImageHtml = `<div class="grid-row" style="padding: 0%;"><img id="${fileId}" src="${newImageUrl}" alt="${fileName}" width="100%" data-api-endpoint="${apiEndpoint || `https://${courseDomain}/api/v1/courses/${courseId}/files/${fileId}`}" data-api-returntype="File" /></div>`;
      
      // Replace the selected image with the new Canvas structure
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = canvasImageHtml;
      const newImageElement = tempDiv.firstChild as HTMLElement;
      
      selectedImage.parentNode?.replaceChild(newImageElement, selectedImage);
      
      // Clear selection
      setSelectedImage(null);
      
      // Trigger input event to update the content
      handleInput();
    }
  }, [selectedImage, handleInput, courseId, courseDomain]);

  // Handle image upload start
  const handleImageUploadStart = useCallback(() => {
    setPendingUploads(prev => prev + 1);
  }, []);

  // Add image click listener
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('click', handleImageClick);
      return () => {
        editor.removeEventListener('click', handleImageClick);
      };
    }
  }, [handleImageClick]);

  // Remove selection when clicking outside
  const handleDocumentClick = useCallback((e: Event) => {
    if (selectedImage && editorRef.current && !editorRef.current.contains(e.target as Node)) {
      selectedImage.style.outline = '';
      selectedImage.style.cursor = '';
      setSelectedImage(null);
    }
  }, [selectedImage]);

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [handleDocumentClick]);

  // Notify parent about pending uploads
  useEffect(() => {
    onPendingUploadsChange?.(pendingUploads > 0);
  }, [pendingUploads, onPendingUploadsChange]);

  return {
    editorRef,
    showToolbar,
    selectedImage,
    showImageUploader,
    pendingUploads,
    handleInput,
    handleFocus,
    handleBlur,
    handleSelection,
    handlePaste,
    handleImageUploaded,
    handleImageUploadStart,
    setShowImageUploader,
  };
};