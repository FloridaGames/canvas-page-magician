import { useState } from "react";
import { CourseInput } from "@/components/CourseInput";
import { PagesList } from "@/components/PagesList";
import { PageEditor } from "@/components/PageEditor";
import { Header } from "@/components/Header";

export type AppState = "input" | "pages" | "editor";

export interface Course {
  id: string;
  name: string;
  url: string;
}

export interface CanvasPage {
  page_id: number;
  title: string;
  body: string;
  published: boolean;
  url: string;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>("input");
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedPage, setSelectedPage] = useState<CanvasPage | null>(null);
  const [isEditingNew, setIsEditingNew] = useState(false);

  const handleCourseSet = (courseData: Course) => {
    setCourse(courseData);
    setCurrentState("pages");
  };

  const handlePageSelect = (page: CanvasPage) => {
    setSelectedPage(page);
    setIsEditingNew(false);
    setCurrentState("editor");
  };

  const handleNewPage = () => {
    setSelectedPage(null);
    setIsEditingNew(true);
    setCurrentState("editor");
  };

  const handleDuplicatePage = (page: CanvasPage) => {
    const duplicatedPage = {
      ...page,
      page_id: 0, // New page will get ID from Canvas
      title: `${page.title} (Copy)`,
    };
    setSelectedPage(duplicatedPage);
    setIsEditingNew(true);
    setCurrentState("editor");
  };

  const handleBackToPages = () => {
    setCurrentState("pages");
    setSelectedPage(null);
    setIsEditingNew(false);
  };

  const handleBackToCourse = () => {
    setCurrentState("input");
    setCourse(null);
    setSelectedPage(null);
    setIsEditingNew(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentState={currentState}
        course={course}
        onBackToCourse={handleBackToCourse}
        onBackToPages={handleBackToPages}
      />
      
      <main className="container mx-auto px-4 py-8">
        {currentState === "input" && (
          <CourseInput onCourseSet={handleCourseSet} />
        )}

        {currentState === "pages" && course && (
          <PagesList
            course={course}
            onPageSelect={handlePageSelect}
            onNewPage={handleNewPage}
            onDuplicatePage={handleDuplicatePage}
          />
        )}

        {currentState === "editor" && course && (
          <PageEditor
            course={course}
            page={selectedPage}
            isNewPage={isEditingNew}
            onBack={handleBackToPages}
          />
        )}
      </main>
    </div>
  );
};

export default Index;