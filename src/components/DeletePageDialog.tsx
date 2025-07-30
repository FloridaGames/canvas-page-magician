import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DeletePageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPageDeleted: () => void;
  pageTitle: string;
  pageId: number;
  courseId: string;
  courseDomain: string;
}

export const DeletePageDialog = ({
  isOpen,
  onClose,
  onPageDeleted,
  pageTitle,
  pageId,
  courseId,
  courseDomain,
}: DeletePageDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('canvas-page-delete', {
        body: {
          domain: courseDomain,
          courseId,
          pageId: pageId.toString(),
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Page Deleted",
        description: `"${pageTitle}" has been successfully deleted.`,
      });

      onPageDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({
        title: "Failed to Delete Page",
        description: error instanceof Error ? error.message : "Unable to delete the page",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Page
          </DialogTitle>
          <DialogDescription className="text-left">
            Are you sure you want to delete <strong>"{pageTitle}"</strong>? This cannot be undone!
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            CANCEL
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "YES"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};