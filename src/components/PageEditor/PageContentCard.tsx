import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HybridEditor } from "@/components/HybridEditor";
import { Save, Loader2 } from "lucide-react";

interface PageContentCardProps {
  body: string;
  isNewPage: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  hasPendingUploads: boolean;
  courseId: string;
  courseDomain?: string;
  onInputChange: (field: string, value: string) => void;
  onSave: () => void;
  onPendingUploadsChange: (hasPending: boolean) => void;
}

export const PageContentCard = ({
  body,
  isNewPage,
  isSaving,
  hasChanges,
  hasPendingUploads,
  courseId,
  courseDomain,
  onInputChange,
  onSave,
  onPendingUploadsChange,
}: PageContentCardProps) => {
  const isDisabled = isSaving || !hasChanges || hasPendingUploads;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Page Content</CardTitle>
          <Button 
            onClick={onSave} 
            disabled={isDisabled}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : hasPendingUploads ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading images...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNewPage ? "Create Page" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <HybridEditor
          value={body}
          onChange={(value) => onInputChange('body', value)}
          placeholder="Start writing your page content... The editor will automatically preserve Canvas layouts and collapsible boxes. Click on images to upload new ones."
          className="w-full"
          courseId={courseId}
          courseDomain={courseDomain}
          onPendingUploadsChange={onPendingUploadsChange}
        />
      </CardContent>
    </Card>
  );
};