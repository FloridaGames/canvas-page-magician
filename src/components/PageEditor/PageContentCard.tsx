import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HybridEditor } from "@/components/HybridEditor";
import { Save, Loader2 } from "lucide-react";

interface PageContentCardProps {
  body: string;
  isNewPage: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  onInputChange: (field: string, value: string) => void;
  onSave: () => void;
}

export const PageContentCard = ({
  body,
  isNewPage,
  isSaving,
  hasChanges,
  onInputChange,
  onSave,
}: PageContentCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Page Content</CardTitle>
          <Button 
            onClick={onSave} 
            disabled={isSaving || !hasChanges}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
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
          placeholder="Start writing your page content... The editor will automatically preserve Canvas layouts and collapsible boxes."
          className="w-full"
        />
      </CardContent>
    </Card>
  );
};