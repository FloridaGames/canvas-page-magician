import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { CanvasPage } from "@/pages/Index";

interface PageEditorHeaderProps {
  pageTitle: string;
  isNewPage: boolean;
  page: CanvasPage | null;
  hasChanges: boolean;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export const PageEditorHeader = ({
  pageTitle,
  isNewPage,
  page,
  hasChanges,
  isSaving,
  onBack,
  onSave,
}: PageEditorHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{pageTitle}</h2>
          <p className="text-muted-foreground">
            {isNewPage ? "Create a new page for your course" : `Editing: ${page?.title}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="mb-6 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="text-sm text-warning-foreground">You have unsaved changes</span>
        </div>
      )}
    </>
  );
};