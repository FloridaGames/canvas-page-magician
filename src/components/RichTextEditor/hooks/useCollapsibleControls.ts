import { useCallback, useState, useEffect } from 'react';

interface UseCollapsibleControlsProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onContentChange: () => void;
}

export const useCollapsibleControls = ({ editorRef, onContentChange }: UseCollapsibleControlsProps) => {
  const [selectedDetails, setSelectedDetails] = useState<HTMLDetailsElement | null>(null);
  const [controlsPosition, setControlsPosition] = useState({ top: 0, left: 0 });
  const [showControls, setShowControls] = useState(false);

  // Create a new empty collapsible section
  const createNewDetailsElement = useCallback(() => {
    const details = document.createElement('details');
    details.className = 'border border-border rounded p-2 my-2';
    
    const summary = document.createElement('summary');
    summary.className = 'font-medium cursor-pointer mb-2';
    summary.textContent = 'New Section';
    
    const content = document.createElement('div');
    content.innerHTML = '<p>Add your content here...</p>';
    
    details.appendChild(summary);
    details.appendChild(content);
    
    return details;
  }, []);

  // Duplicate a details element
  const duplicateDetails = useCallback((originalDetails: HTMLDetailsElement) => {
    const cloned = originalDetails.cloneNode(true) as HTMLDetailsElement;
    
    // Update the summary text to indicate it's a copy
    const summary = cloned.querySelector('summary');
    if (summary) {
      summary.textContent = `${summary.textContent} (Copy)`;
    }
    
    return cloned;
  }, []);

  // Handle duplicate action
  const handleDuplicate = useCallback(() => {
    if (!selectedDetails || !editorRef.current) return;
    
    const duplicated = duplicateDetails(selectedDetails);
    selectedDetails.parentNode?.insertBefore(duplicated, selectedDetails.nextSibling);
    
    setShowControls(false);
    setSelectedDetails(null);
    onContentChange();
  }, [selectedDetails, editorRef, duplicateDetails, onContentChange]);

  // Handle add new section below
  const handleAddBelow = useCallback(() => {
    if (!selectedDetails || !editorRef.current) return;
    
    const newDetails = createNewDetailsElement();
    selectedDetails.parentNode?.insertBefore(newDetails, selectedDetails.nextSibling);
    
    setShowControls(false);
    setSelectedDetails(null);
    onContentChange();
  }, [selectedDetails, editorRef, createNewDetailsElement, onContentChange]);

  // Handle remove section
  const handleRemove = useCallback(() => {
    if (!selectedDetails || !editorRef.current) return;
    
    // Confirm deletion
    if (window.confirm('Are you sure you want to remove this section?')) {
      selectedDetails.remove();
      setShowControls(false);
      setSelectedDetails(null);
      onContentChange();
    }
  }, [selectedDetails, editorRef, onContentChange]);

  // Handle clicks on details elements
  const handleDetailsClick = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    const details = target.closest('details') as HTMLDetailsElement;
    
    if (!details) return;
    
    // Don't interfere with normal summary toggle behavior
    if (target.tagName.toLowerCase() === 'summary') return;
    
    // Show controls when clicking anywhere else in the details element
    e.preventDefault();
    e.stopPropagation();
    
    const rect = details.getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect();
    
    if (editorRect) {
      setControlsPosition({
        top: rect.top - editorRect.top,
        left: rect.right - editorRect.left - 120 // Offset to position controls to the right
      });
    }
    
    setSelectedDetails(details);
    setShowControls(true);
  }, [editorRef]);

  // Handle clicks outside to hide controls
  const handleDocumentClick = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    
    // Hide controls if clicking outside
    if (!target.closest('.collapsible-controls') && !target.closest('details')) {
      setShowControls(false);
      setSelectedDetails(null);
    }
  }, []);

  // Setup event listeners for collapsible elements
  const setupCollapsibleListeners = useCallback(() => {
    if (!editorRef.current) return;
    
    const details = editorRef.current.querySelectorAll('details');
    
    details.forEach((detail) => {
      // Remove existing listeners to avoid duplicates
      detail.removeEventListener('click', handleDetailsClick);
      
      // Add click listener
      detail.addEventListener('click', handleDetailsClick);
      
      // Add hover effect
      detail.style.cursor = 'pointer';
      detail.style.transition = 'border-color 0.2s';
      
      const originalBorderColor = detail.style.borderColor;
      
      detail.addEventListener('mouseenter', () => {
        detail.style.borderColor = 'hsl(var(--primary))';
      });
      
      detail.addEventListener('mouseleave', () => {
        detail.style.borderColor = originalBorderColor || 'hsl(var(--border))';
      });
    });
  }, [editorRef, handleDetailsClick]);

  // Setup document click listener
  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [handleDocumentClick]);

  // Setup listeners when content changes
  useEffect(() => {
    setupCollapsibleListeners();
  }, [setupCollapsibleListeners]);

  return {
    selectedDetails,
    controlsPosition,
    showControls,
    handleDuplicate,
    handleAddBelow,
    handleRemove,
    setupCollapsibleListeners
  };
};