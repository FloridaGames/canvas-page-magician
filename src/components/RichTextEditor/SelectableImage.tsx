import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SelectableImageProps {
  src: string;
  alt: string;
  className?: string;
  courseId?: string;
  courseDomain?: string;
  onImageChange?: (newSrc: string, fileId: string, fileName: string) => void;
}

const SelectableImage: React.FC<SelectableImageProps> = ({
  src,
  alt,
  className,
  courseId,
  courseDomain,
  onImageChange
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSelected(!isSelected);
  };

  const handleChangeImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      if (courseId && courseDomain) {
        // Upload to Canvas
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const { data, error } = await supabase.functions.invoke('canvas-image-upload', {
          body: {
            domain: courseDomain,
            courseId: courseId,
            imageFile: base64,
            fileName: file.name,
            mimeType: file.type,
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        const newImageUrl = data.previewUrl;
        setCurrentSrc(newImageUrl);
        onImageChange?.(newImageUrl, data.fileId, data.fileName);

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } else {
        // Fallback to local preview
        const newImageUrl = URL.createObjectURL(file);
        setCurrentSrc(newImageUrl);
        onImageChange?.(newImageUrl, '', file.name);
      }

      setIsSelected(false); // Deselect after successful upload
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "relative cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-primary ring-offset-2",
          className
        )}
        onClick={handleImageClick}
      >
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            "w-full h-auto transition-all duration-200",
            isSelected && "brightness-90"
          )}
          style={{ position: 'relative' }}
        />

        {/* Selection overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
        )}
      </div>

      {/* Change Image Button */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            onClick={handleChangeImage}
            size="sm"
            disabled={isUploading}
            className="shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Change Image'}
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default SelectableImage;