import { Course, CanvasPage } from "@/pages/Index";
import { usePageEditor } from "./PageEditor/hooks/usePageEditor";
import { PageEditorHeader } from "./PageEditor/PageEditorHeader";
import { PageDetailsCard } from "./PageEditor/PageDetailsCard";
import { PageContentCard } from "./PageEditor/PageContentCard";
import { SavePreviewModal } from "./PageEditor/SavePreviewModal";

interface PageEditorProps {
  course: Course;
  page: CanvasPage | null;
  isNewPage: boolean;
  onBack: () => void;
}

export const PageEditor = ({ course, page, isNewPage, onBack }: PageEditorProps) => {
  const {
    title,
    body,
    published,
    isSaving,
    hasChanges,
    showSavePreview,
    handleSaveClick,
    handleConfirmSave,
    handleInputChange,
    getPageTitle,
    getCourseDomain,
    setShowSavePreview,
  } = usePageEditor({ course, page, isNewPage, onBack });

  return (
    <div className="max-w-none mx-auto">{/* Removed max-w-4xl constraint */}
      <PageEditorHeader
        pageTitle={getPageTitle()}
        isNewPage={isNewPage}
        page={page}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onBack={onBack}
        onSave={handleSaveClick}
      />

      <div className="grid gap-6">
        <PageDetailsCard
          title={title}
          published={published}
          onInputChange={handleInputChange}
        />

        <PageContentCard
          body={body}
          isNewPage={isNewPage}
          isSaving={isSaving}
          hasChanges={hasChanges}
          courseId={course.id}
          courseDomain={getCourseDomain()}
          onInputChange={handleInputChange}
          onSave={handleSaveClick}
        />
      </div>

      <SavePreviewModal
        isOpen={showSavePreview}
        onClose={() => setShowSavePreview(false)}
        onConfirmSave={handleConfirmSave}
        title={title}
        body={body}
        published={published}
        isSaving={isSaving}
      />
    </div>
  );
};