import { Course, CanvasPage } from "@/pages/Index";
import { usePageEditor } from "./PageEditor/hooks/usePageEditor";
import { PageEditorHeader } from "./PageEditor/PageEditorHeader";
import { PageDetailsCard } from "./PageEditor/PageDetailsCard";
import { PageContentCard } from "./PageEditor/PageContentCard";

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
    hasPendingUploads,
    handleSave,
    handleInputChange,
    getPageTitle,
    getCourseDomain,
    handlePendingUploadsChange,
  } = usePageEditor({ course, page, isNewPage, onBack });

  return (
    <div className="max-w-4xl mx-auto">
      <PageEditorHeader
        pageTitle={getPageTitle()}
        isNewPage={isNewPage}
        page={page}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onBack={onBack}
        onSave={handleSave}
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
          hasPendingUploads={hasPendingUploads}
          courseId={course.id}
          courseDomain={getCourseDomain()}
          onInputChange={handleInputChange}
          onSave={handleSave}
          onPendingUploadsChange={handlePendingUploadsChange}
        />
      </div>
    </div>
  );
};