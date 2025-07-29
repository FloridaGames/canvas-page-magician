import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUploader } from "@/components/ImageUploader";
import { Eye, Save, X } from "lucide-react";

interface SavePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: (customImage?: File | null) => void;
  title: string;
  body: string;
  published: boolean;
  isSaving: boolean;
}

export const SavePreviewModal = ({ 
  isOpen, 
  onClose, 
  onConfirmSave, 
  title, 
  body, 
  published,
  isSaving 
}: SavePreviewModalProps) => {
  const [customImage, setCustomImage] = useState<File | null>(null);

  const handleSave = () => {
    onConfirmSave(customImage);
  };

  const handleClose = () => {
    setCustomImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview & Save Page
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Page Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Page Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: {published ? "Published" : "Draft"}
                </p>
              </div>
              
              {body && (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              )}
              
              {!body && (
                <p className="text-muted-foreground italic">No content added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Custom Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Page Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                onImageSelect={setCustomImage}
                selectedImage={customImage}
                onRemoveImage={() => setCustomImage(null)}
                description="Upload a custom image for this page. This only shows in this editor, it will not be used in Canvas."
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Page"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};