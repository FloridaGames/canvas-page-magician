import { useRef, useEffect, useCallback, useState } from 'react';

interface UseRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  inline: boolean;
  courseId?: string;
  courseDomain?: string;
}

export const useRichTextEditor = ({ value, onChange, inline, courseId, courseDomain }: UseRichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(!inline);
  const [selectedImage, setSelectedImage] = useState<HTMLElement | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);

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

  // Handle image/iframe selection
  const handleImageClick = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.tagName === 'IFRAME') {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove previous selection
      if (selectedImage) {
        selectedImage.style.outline = '';
        selectedImage.style.cursor = '';
        // Remove any existing change button
        const existingButton = selectedImage.parentNode?.querySelector('.change-image-button');
        if (existingButton) {
          existingButton.remove();
        }
      }
      
      const element = target as HTMLElement;
      setSelectedImage(element);
      
      // Get and log the current src
      const currentSrc = element.tagName === 'IFRAME' ? 
        (element as HTMLIFrameElement).src : 
        (element as HTMLImageElement).src;
      console.log('Selected element src:', currentSrc);
      
      // Add visual selection indicator
      element.style.outline = '2px solid #3b82f6';
      element.style.cursor = 'pointer';
      element.style.position = 'relative';
      
      // Create and show "Change Image" button
      const changeButton = document.createElement('button');
      changeButton.className = 'change-image-button';
      changeButton.innerHTML = 'Change Image';
      changeButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
      
      // Position button relative to element
      const container = element.parentNode as HTMLElement;
      if (container) {
        container.style.position = 'relative';
        container.appendChild(changeButton);
        
        changeButton.addEventListener('click', (btnE) => {
          btnE.preventDefault();
          btnE.stopPropagation();
          setShowImageUploader(true);
        });
      }
    }
  }, [selectedImage]);

  // Handle image replacement
  const handleImageUploaded = useCallback((newImageUrl: string, fileId: string, fileName: string, cloudinaryUrl?: string) => {
    if (selectedImage && editorRef.current) {
      // Log the new image src for debugging
      console.log('New uploaded image src:', newImageUrl);
      console.log('Cloudinary URL:', cloudinaryUrl);
      
      // Remove the change button before replacement
      const changeButton = selectedImage.parentNode?.querySelector('.change-image-button');
      if (changeButton) {
        changeButton.remove();
      }
      
      if (selectedImage.tagName === 'IFRAME' && cloudinaryUrl) {
        // Update iframe with Cloudinary URL
        const iframe = selectedImage as HTMLIFrameElement;
        iframe.src = cloudinaryUrl;
        iframe.setAttribute('data-api-endpoint', cloudinaryUrl);
        console.log('Updated iframe with Cloudinary URL:', cloudinaryUrl);
      } else {
        // Create the Canvas-specific HTML structure for img tags
        const canvasImageHtml = `<div class="grid-row" style="padding: 0%;"><img id="${fileId}" src="${newImageUrl}" alt="${fileName}" width="100%" /></div>`;
        
        // Replace the selected image with the new Canvas structure
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = canvasImageHtml;
        const newImageElement = tempDiv.firstChild as HTMLElement;
        
        selectedImage.parentNode?.replaceChild(newImageElement, selectedImage);
      }
      
      // Clear selection and reset styles
      selectedImage.style.outline = '';
      selectedImage.style.cursor = '';
      setSelectedImage(null);
      
      // Log the replacement completion
      console.log('Image replacement completed');
      
      // Trigger input event to update the content and send back via API
      handleInput();
    }
  }, [selectedImage, handleInput]);

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
      // Remove the change button
      const changeButton = selectedImage.parentNode?.querySelector('.change-image-button');
      if (changeButton) {
        changeButton.remove();
      }
      
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

  return {
    editorRef,
    showToolbar,
    selectedImage,
    showImageUploader,
    handleInput,
    handleFocus,
    handleBlur,
    handleSelection,
    handlePaste,
    handleImageUploaded,
    setShowImageUploader,
  };
};