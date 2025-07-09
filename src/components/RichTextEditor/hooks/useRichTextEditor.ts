import { useRef, useEffect, useCallback, useState } from 'react';
import SelectableImage from '../SelectableImage';
import { createRoot } from 'react-dom/client';
import React from 'react';

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

  // Handle image replacement using SelectableImage component
  const replaceImageWithSelectableImage = useCallback((imgElement: HTMLImageElement) => {
    const currentSrc = imgElement.src;
    const currentAlt = imgElement.alt || 'Image';
    const originalWidth = imgElement.width || imgElement.offsetWidth;
    const originalHeight = imgElement.height || imgElement.offsetHeight;
    const originalStyle = imgElement.style.cssText;
    const originalClass = imgElement.className;
    
    // Create a wrapper div for the SelectableImage component
    const wrapper = document.createElement('div');
    wrapper.className = 'selectable-image-wrapper';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = originalWidth ? `${originalWidth}px` : 'auto';
    wrapper.style.height = originalHeight ? `${originalHeight}px` : 'auto';
    
    // Replace the original img with our wrapper
    imgElement.parentNode?.replaceChild(wrapper, imgElement);
    
    // Create React root and render SelectableImage
    const root = createRoot(wrapper);
    
    const handleImageChange = (newSrc: string, fileId: string, fileName: string) => {
      // Create new img element with original dimensions
      const newImg = document.createElement('img');
      newImg.src = newSrc;
      newImg.alt = fileName || currentAlt;
      newImg.id = fileId;
      newImg.className = originalClass;
      newImg.style.cssText = originalStyle;
      
      // Preserve original dimensions
      if (originalWidth) newImg.width = originalWidth;
      if (originalHeight) newImg.height = originalHeight;
      
      // Ensure the image loads and displays immediately
      newImg.onload = () => {
        // Replace the wrapper with the new image
        wrapper.parentNode?.replaceChild(newImg, wrapper);
        
        // Dispose the React root
        root.unmount();
        
        // Trigger input event to update content
        handleInput();
      };
      
      // If image fails to load, still replace but log error
      newImg.onerror = () => {
        console.error('Failed to load new image:', newSrc);
        wrapper.parentNode?.replaceChild(newImg, wrapper);
        root.unmount();
        handleInput();
      };
    };
    
    root.render(
      React.createElement(SelectableImage, {
        src: currentSrc,
        alt: currentAlt,
        courseId,
        courseDomain,
        onImageChange: handleImageChange,
        className: originalClass,
        style: { width: '100%', height: '100%', objectFit: 'contain' },
        targetWidth: originalWidth || 1230,
        targetHeight: originalHeight || 120
      })
    );
  }, [courseId, courseDomain, handleInput]);

  // Process existing images to make them selectable
  const processExistingImages = useCallback(() => {
    if (!editorRef.current) return;
    
    const images = editorRef.current.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => {
      // Skip if already processed
      if (img.closest('.selectable-image-wrapper')) return;
      
      // Add click handler to convert to SelectableImage
      const handleClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        replaceImageWithSelectableImage(img);
      };
      
      // Add visual hover effect
      img.style.cursor = 'pointer';
      img.style.transition = 'opacity 0.2s';
      img.addEventListener('click', handleClick);
      img.addEventListener('mouseenter', () => {
        img.style.opacity = '0.8';
      });
      img.addEventListener('mouseleave', () => {
        img.style.opacity = '1';
      });
    });
  }, [replaceImageWithSelectableImage]);

  // Process images and add event listeners
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      // Process existing images on content change
      processExistingImages();
      
      // Observer to process new images
      const observer = new MutationObserver(() => {
        processExistingImages();
      });
      
      observer.observe(editor, { childList: true, subtree: true });
      
      return () => {
        observer.disconnect();
      };
    }
  }, [processExistingImages, value]);


  return {
    editorRef,
    showToolbar,
    handleInput,
    handleFocus,
    handleBlur,
    handleSelection,
    handlePaste,
  };
};