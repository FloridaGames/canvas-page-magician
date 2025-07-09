import React from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollapsibleControlsProps {
  onDuplicate: () => void;
  onAddBelow: () => void;
  onRemove: () => void;
  position: { top: number; left: number };
}

export const CollapsibleControls = ({ 
  onDuplicate, 
  onAddBelow, 
  onRemove, 
  position 
}: CollapsibleControlsProps) => {
  return (
    <div 
      className="absolute z-50 flex gap-1 bg-background border border-border rounded-lg shadow-lg p-1 animate-fade-in"
      style={{ 
        top: position.top, 
        left: position.left,
        transform: 'translateX(-100%) translateY(-50%)' 
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onDuplicate}
        className="h-8 w-8 p-0 hover:bg-muted"
        title="Duplicate section"
      >
        <Copy className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddBelow}
        className="h-8 w-8 p-0 hover:bg-muted"
        title="Add new section below"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
        title="Remove section"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};