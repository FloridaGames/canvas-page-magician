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
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [showSavePreview, setShowSavePreview] = useState(false);

  const uploadCustomImage = async (imageFile: File, pageTitle: string) => {
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(imageFile);
      });

      const fileName = `${pageTitle.replace(/\s+/g, '_')}.${imageFile.name.split('.').pop()}`;
      
      const { data, error } = await supabase.functions.invoke('canvas-image-upload', {
        body: {
          domain: getCourseDomain(),
          courseId: course.id,
          imageFile: base64Data,
          fileName: fileName,
          mimeType: imageFile.type
        }
      });

      if (error) {
        console.error('Error uploading custom image:', error);
        return false;
      }

      if (data.error) {
        console.error('Error uploading custom image:', data.error);
        return false;
      }

      console.log('Custom image uploaded successfully:', data);
      return true;
    } catch (error) {
      console.error('Error uploading custom image:', error);
      return false;
    }
  };

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
    setCustomImage(null);
    setShowSavePreview(false);
  }, [page]);

  const handleSaveClick = () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Page title is required",
        variant: "destructive",
      });
      return;
    }
    setShowSavePreview(true);
  };

  const handleConfirmSave = async (imageFile?: File | null) => {
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
      setShowSavePreview(false);

      // Upload custom image if provided
      if (imageFile) {
        try {
          await uploadCustomImage(imageFile, title.trim());
          console.log('Custom image uploaded successfully');
        } catch (imageError) {
          console.warn('Custom image upload failed:', imageError);
          // Don't fail the entire save process if image upload fails
        }
      }
      
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
    showSavePreview,
    handleSaveClick,
    handleConfirmSave,
    handleInputChange,
    getPageTitle,
    getCourseDomain,
    setShowSavePreview,
  };
};