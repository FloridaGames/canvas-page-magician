import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const ImageUploadDemo = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=srgb&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzM2MTc5MzV8&ixlib=rb-4.0.3&q=85');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
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
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });

      // Upload using the demo function
      const { data, error } = await supabase.functions.invoke('image-upload-demo', {
        body: {
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

      setUploadResult(data);
      
      toast({
        title: "Upload Complete!",
        description: `Image uploaded successfully: ${data.fileName}`,
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=srgb&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MzM2MTc5MzV8&ixlib=rb-4.0.3&q=85');
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Upload Image Preview Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg border"
            />
            {uploadResult && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <CheckCircle className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <label htmlFor="upload" className="block text-sm font-medium">
              UPDATE AVATAR
            </label>
            <Input
              ref={fileInputRef}
              id="upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>

          {/* Upload Button */}
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </>
            )}
          </Button>

          {/* Upload Result */}
          {uploadResult && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-green-800 mb-2">Upload Successful!</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>File ID:</strong> {uploadResult.fileId}</p>
                  <p><strong>File Name:</strong> {uploadResult.fileName}</p>
                  <p><strong>Upload URL:</strong></p>
                  <p className="break-all text-xs bg-green-100 p-2 rounded">
                    {uploadResult.url}
                  </p>
                  <p><strong>Size:</strong> {Math.round(uploadResult.size / 1024)} KB</p>
                  <p><strong>Uploaded At:</strong> {new Date(uploadResult.uploadedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reset Button */}
          {(selectedFile || uploadResult) && (
            <Button 
              onClick={resetUpload} 
              variant="outline"
              className="w-full"
              disabled={isUploading}
            >
              Reset
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};