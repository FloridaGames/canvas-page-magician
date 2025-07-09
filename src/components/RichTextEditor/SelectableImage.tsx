import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Crop as CropIcon, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

    // Check uploaded image dimensions vs target dimensions
    const checkImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = URL.createObjectURL(file);
      });
    };

    try {
      const uploadedImageDims = await checkImageDimensions(file);
      
      // Show warning if uploaded image is smaller than target dimensions
      if (uploadedImageDims.width < targetWidth || uploadedImageDims.height < targetHeight) {
        toast({
          title: "Image Size Warning",
          description: `Uploaded image (${uploadedImageDims.width}×${uploadedImageDims.height}) is smaller than expected (${targetWidth}×${targetHeight}). Image may appear pixelated when scaled.`,
          variant: "destructive",
        });
      }

      // Scale the uploaded image to target dimensions
      const scaleImageToTargetSize = (file: File): Promise<File> => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            if (ctx) {
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              canvas.toBlob((blob) => {
                if (blob) {
                  const scaledFile = new File([blob], file.name, { type: file.type });
                  resolve(scaledFile);
                } else {
                  resolve(file); // Fallback to original file
                }
              }, file.type, 0.9);
            } else {
              resolve(file); // Fallback to original file
            }
          };
          
          img.src = URL.createObjectURL(file);
        });
      };

      const scaledFile = await scaleImageToTargetSize(file);

      if (courseId && courseDomain) {
        // Upload to Canvas using scaled file
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(scaledFile);
        });

        const { data, error } = await supabase.functions.invoke('canvas-image-upload', {
          body: {
            domain: courseDomain,
            courseId: courseId,
            imageFile: base64,
            fileName: scaledFile.name,
            mimeType: scaledFile.type,
          },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        const newImageUrl = data.previewUrl;
        setCurrentSrc(newImageUrl);
        onImageChange?.(newImageUrl, data.fileId, data.fileName);

        toast({
          title: "Success",
          description: "Image uploaded and scaled successfully",
        });
      } else {
        // Fallback to local preview using scaled file
        const newImageUrl = URL.createObjectURL(scaledFile);
        setCurrentSrc(newImageUrl);
        onImageChange?.(newImageUrl, '', scaledFile.name);
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
          <Button
            onClick={handleCropImage}
            size="sm"
            variant="secondary"
            className="shadow-lg"
          >
            <CropIcon className="w-4 h-4 mr-2" />
            Crop
          </Button>
          <Button
            onClick={handleChangeImage}
            size="sm"
            disabled={isUploading}
            className="shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Change'}
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