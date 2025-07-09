import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Crop as CropIcon, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useImageSize } from 'react-image-size';

interface SelectableImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  courseId?: string;
  courseDomain?: string;
  targetWidth?: number;
  targetHeight?: number;
  onImageChange?: (newSrc: string, fileId: string, fileName: string) => void;
}

const SelectableImage: React.FC<SelectableImageProps> = ({
  src,
  alt,
  className,
  style,
  courseId,
  courseDomain,
  targetWidth = 1230,
  targetHeight = 120,
  onImageChange
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isUploading, setIsUploading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [tempImageSrc, setTempImageSrc] = useState<string>('');
  const [storedDimensions, setStoredDimensions] = useState<{width: number, height: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Get image dimensions using react-image-size
  const [dimensions, { loading: dimensionsLoading, error: dimensionsError }] = useImageSize(currentSrc);

  // Store dimensions when image is selected and dimensions are loaded
  useEffect(() => {
    if (isSelected && dimensions && !dimensionsLoading && !dimensionsError) {
      setStoredDimensions({ width: dimensions.width, height: dimensions.height });
    }
  }, [isSelected, dimensions, dimensionsLoading, dimensionsError]);

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

  const handleCropImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTempImageSrc(currentSrc);
    setShowCrop(true);
    setIsSelected(false);
  };

  const getCroppedImg = useCallback((
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set canvas size to target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.9);
    });
  }, [targetWidth, targetHeight]);

  const handleCropComplete = async () => {
    if (!crop || !imgRef.current) return;

    try {
      const pixelCrop: PixelCrop = {
        x: crop.x,
        y: crop.y,
        width: crop.width,
        height: crop.height,
        unit: 'px'
      };

      const croppedImageUrl = await getCroppedImg(imgRef.current, pixelCrop);
      setCurrentSrc(croppedImageUrl);
      onImageChange?.(croppedImageUrl, '', alt);
      setShowCrop(false);
      setTempImageSrc('');
      
      toast({
        title: "Success",
        description: "Image cropped successfully",
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: "Crop Failed",
        description: "Failed to crop image",
        variant: "destructive",
      });
    }
  };

  const handleCropCancel = () => {
    setShowCrop(false);
    setTempImageSrc('');
    setCrop(undefined);
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

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 25MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // If we have stored dimensions, automatically crop and resize
      if (storedDimensions) {
        const croppedImageUrl = await autoCropAndResize(file, storedDimensions.width, storedDimensions.height);
        setCurrentSrc(croppedImageUrl);
        onImageChange?.(croppedImageUrl, '', file.name);
        
        toast({
          title: "Success",
          description: "Image uploaded and resized automatically",
        });
      } else if (courseId && courseDomain) {
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

  // Auto crop and resize function
  const autoCropAndResize = useCallback((
    file: File,
    targetWidth: number,
    targetHeight: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set canvas size to target dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate crop dimensions to maintain aspect ratio
        const sourceAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;

        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;

        if (sourceAspect > targetAspect) {
          // Source is wider, crop width
          sourceWidth = img.height * targetAspect;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Source is taller, crop height
          sourceHeight = img.width / targetAspect;
          sourceY = (img.height - sourceHeight) / 2;
        }

        // Draw cropped and resized image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(URL.createObjectURL(blob));
        }, 'image/jpeg', 0.9);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  if (showCrop) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Crop Image</h3>
            <p className="text-sm text-muted-foreground">
              Drag to select the area you want to crop. Target size: {targetWidth}x{targetHeight}px
            </p>
          </div>
          
          <div className="flex justify-center mb-4">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={targetWidth / targetHeight}
              className="max-w-full max-h-[60vh]"
            >
              <img
                ref={imgRef}
                src={tempImageSrc}
                alt={alt}
                className="max-w-full max-h-[60vh] object-contain"
                onLoad={() => {
                  if (!crop && imgRef.current) {
                    const { width, height } = imgRef.current;
                    const aspect = targetWidth / targetHeight;
                    let cropWidth = width;
                    let cropHeight = width / aspect;
                    
                    if (cropHeight > height) {
                      cropHeight = height;
                      cropWidth = height * aspect;
                    }
                    
                    setCrop({
                      unit: 'px',
                      x: (width - cropWidth) / 2,
                      y: (height - cropHeight) / 2,
                      width: cropWidth,
                      height: cropHeight,
                    });
                  }
                }}
              />
            </ReactCrop>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={handleCropCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleCropComplete} disabled={!crop}>
              <Check className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          style={{ 
            position: 'relative',
            ...style
          }}
        />

        {/* Selection overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
        )}
      </div>

      {/* Action Buttons */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {!storedDimensions && (
            <Button
              onClick={handleCropImage}
              size="sm"
              variant="secondary"
              className="shadow-lg"
            >
              <CropIcon className="w-4 h-4 mr-2" />
              Crop
            </Button>
          )}
          <Button
            onClick={handleChangeImage}
            size="sm"
            disabled={isUploading}
            className="shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : storedDimensions ? 'Replace & Auto-Resize' : 'Change'}
          </Button>
        </div>
      )}
      
      {/* Dimensions Display */}
      {isSelected && storedDimensions && (
        <div className="absolute bottom-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Target: {storedDimensions.width}×{storedDimensions.height}px
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