import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string, fileId: string, fileName: string, apiEndpoint?: string) => void;
  onUploadStart?: () => void;
  courseId?: string;
  courseDomain?: string;
  currentImage?: HTMLImageElement | null;
}

export const ImageUploader = ({
  isOpen,
  onClose,
  onImageUploaded,
  onUploadStart,
  courseId,
  courseDomain,
  currentImage,
}: ImageUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<{
    url: string;
    fileId: string;
    fileName: string;
    apiEndpoint: string;
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !courseId || !courseDomain) {
      toast({
        title: "Upload Error",
        description: "Missing required information for upload",
        variant: "destructive",
      });
      return;
    }

    // Notify parent that upload is starting
    onUploadStart?.();
    setIsUploading(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });

      // Upload to Canvas
      const { data, error } = await supabase.functions.invoke('canvas-image-upload', {
        body: {
          domain: courseDomain,
          courseId: courseId,
          imageFile: base64,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      // Store upload data and show confirmation
      setUploadedData({
        url: data.url,
        fileId: data.fileId,
        fileName: data.fileName,
        apiEndpoint: data.apiEndpoint,
      });
      setShowConfirmation(true);

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      
      // Important: Call onImageUploaded with empty values to decrement the pending counter
      onImageUploaded('', '', '', '');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmReplace = () => {
    if (uploadedData) {
      onImageUploaded(
        uploadedData.url,
        uploadedData.fileId,
        uploadedData.fileName,
        uploadedData.apiEndpoint
      );
      handleClose();
    }
  };

  const handleCancelReplace = () => {
    setUploadedData(null);
    setShowConfirmation(false);
    // Keep the dialog open to allow user to try again
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadedData(null);
    setShowConfirmation(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  // Extract current image info
  const getCurrentImageInfo = () => {
    if (!currentImage) return null;
    
    return {
      id: currentImage.id || 'Unknown',
      src: currentImage.src || 'Unknown',
      alt: currentImage.alt || 'No alt text',
    };
  };

  const currentImageInfo = getCurrentImageInfo();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {showConfirmation ? 'Confirm Image Replacement' : 'Upload New Image'}
          </DialogTitle>
        </DialogHeader>

        {showConfirmation && uploadedData ? (
          <div className="space-y-4">
            {/* Current Image Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-destructive">Current Image (will be replaced)</Label>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                <div className="text-xs">
                  <span className="font-medium">ID:</span> {currentImageInfo?.id}
                </div>
                <div className="text-xs">
                  <span className="font-medium">Source:</span> {currentImageInfo?.src}
                </div>
                <div className="text-xs">
                  <span className="font-medium">Alt Text:</span> {currentImageInfo?.alt}
                </div>
              </div>
            </div>

            {/* New Image Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-green-600">New Image (replacement)</Label>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <div className="text-xs">
                  <span className="font-medium">ID:</span> {uploadedData.fileId}
                </div>
                <div className="text-xs">
                  <span className="font-medium">Source:</span> {uploadedData.url}
                </div>
                <div className="text-xs">
                  <span className="font-medium">Alt Text:</span> {uploadedData.fileName}
                </div>
                <div className="text-xs">
                  <span className="font-medium">API Endpoint:</span> {uploadedData.apiEndpoint}
                </div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Confirm:</strong> This will replace the current image with the new uploaded image. 
                The HTML structure will include the Canvas LMS grid-row wrapper and proper attributes.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancelReplace}>
                Cancel
              </Button>
              <Button onClick={handleConfirmReplace} className="bg-green-600 hover:bg-green-700">
                Confirm Replace
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show current image info at the top */}
            {currentImageInfo && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Image</Label>
                <div className="p-3 bg-muted/50 border rounded-lg space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">ID:</span> {currentImageInfo.id}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Source:</span> {currentImageInfo.src}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Alt Text:</span> {currentImageInfo.alt}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="image-upload">Select Image</Label>
              <Input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  File: {selectedFile?.name} ({selectedFile ? Math.round(selectedFile.size / 1024) : 0} KB)
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload to Canvas
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};