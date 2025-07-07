import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Course, CanvasPage } from "@/pages/Index";
import { extractDomainFromUrl } from "../utils";

interface UsePageEditorProps {
  course: Course;
  page: CanvasPage | null;
  isNewPage: boolean;
  onBack: () => void;
}

export const usePageEditor = ({ course, page, isNewPage, onBack }: UsePageEditorProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setBody(page.body || "");
      setPublished(page.published);
    } else {
      // Reset for new page
      setTitle("");
      setBody("");
      setPublished(false);
    }
    setHasChanges(false);
  }, [page]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Page title is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { domain } = extractDomainFromUrl(course.url);
      
      const pageData = {
        title: title.trim(),
        body: body,
        published: published,
      };

      let result;
      
      if (isNewPage || !page?.page_id) {
        // Create new page
        result = await supabase.functions.invoke('canvas-page-create', {
          body: { 
            domain, 
            courseId: course.id, 
            pageData 
          }
        });
      } else {
        // Update existing page
        result = await supabase.functions.invoke('canvas-page-update', {
          body: { 
            domain, 
            courseId: course.id, 
            pageId: page.page_id,
            pageData 
          }
        });
      }

      const { data, error } = result;

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: isNewPage ? "Page created successfully" : "Page updated successfully",
      });

      setHasChanges(false);
      
      // Go back to pages list after successful save
      setTimeout(() => {
        onBack();
      }, 1000);

    } catch (error) {
      console.error('Error saving page:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Unable to save page",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setHasChanges(true);
    
    switch (field) {
      case 'title':
        setTitle(value as string);
        break;
      case 'body':
        setBody(value as string);
        break;
      case 'published':
        setPublished(value as boolean);
        break;
    }
  };

  const getPageTitle = () => {
    if (isNewPage) return "Create New Page";
    if (page?.title.includes("(Copy)")) return "Edit Duplicated Page";
    return "Edit Page";
  };

  const getCourseDomain = () => {
    try {
      return extractDomainFromUrl(course.url).domain;
    } catch {
      return undefined;
    }
  };

  return {
    title,
    body,
    published,
    isSaving,
    hasChanges,
    handleSave,
    handleInputChange,
    getPageTitle,
    getCourseDomain,
  };
};