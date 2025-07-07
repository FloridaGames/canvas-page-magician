import { ArrowLeft, BookOpen, FileText, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppState, Course } from "@/pages/Index";

interface HeaderProps {
  currentState: AppState;
  course: Course | null;
  onBackToCourse: () => void;
  onBackToPages: () => void;
}

export const Header = ({ currentState, course, onBackToCourse, onBackToPages }: HeaderProps) => {
  const getStateInfo = () => {
    switch (currentState) {
      case "input":
        return { title: "Canvas Page Magician", subtitle: "Connect to your Canvas course" };
      case "pages":
        return { title: course?.name || "Course Pages", subtitle: "Manage your course pages" };
      case "editor":
        return { title: "Page Editor", subtitle: "Edit your Canvas page" };
      default:
        return { title: "Canvas Page Magician", subtitle: "" };
    }
  };

  const { title, subtitle } = getStateInfo();

  return (
    <header className="bg-card border-b border-border shadow-card-hover">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-hero rounded-lg">
                {currentState === "input" && <BookOpen className="h-6 w-6 text-primary-foreground" />}
                {currentState === "pages" && <FileText className="h-6 w-6 text-primary-foreground" />}
                {currentState === "editor" && <Edit3 className="h-6 w-6 text-primary-foreground" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentState === "editor" && (
              <Button variant="outline" size="sm" onClick={onBackToPages}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pages
              </Button>
            )}
            {currentState === "pages" && (
              <Button variant="outline" size="sm" onClick={onBackToCourse}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change Course
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};