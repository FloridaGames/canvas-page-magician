import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Course, CanvasPage } from "@/pages/Index";
import { extractDomainFromUrl } from "../utils";
import { useScreenCapture } from "@/hooks/useScreenCapture";

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
  const { capturePageScreenshot } = useScreenCapture();

  const uploadScreenshotToCloudinary = async (imageUrl: string, pageTitle: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Convert blob to base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });

      const fileName = `${pageTitle.replace(/\s+/g, '_')}.png`;
      
      const { data, error } = await supabase.functions.invoke('canvas-image-upload', {
        body: {
          domain: getCourseDomain(),
          courseId: course.id,
          imageFile: base64Data,
          fileName: fileName,
          mimeType: 'image/png'
        }
      });

      if (error) {
        console.error('Error uploading screenshot:', error);
        return false;
      }

      if (data.error) {
        console.error('Error uploading screenshot:', data.error);
        return false;
      }

      console.log('Screenshot uploaded successfully:', data);
      return true;
    } catch (error) {
      console.error('Error uploading screenshot:', error);
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

      // Capture and upload screenshot after successful save
      try {
        // Construct the Canvas page URL
        const pageUrl = `${course.url}/pages/${data.page_id || (data.url ? data.url.split('/').pop() : '')}`;
        
        const screenshotResult = await capturePageScreenshot(pageUrl);
        
        if (screenshotResult.success && screenshotResult.imageUrl) {
          await uploadScreenshotToCloudinary(screenshotResult.imageUrl, title.trim());
          console.log('Screenshot captured and uploaded successfully');
        } else {
          console.warn('Screenshot capture failed:', screenshotResult.error);
        }
      } catch (screenshotError) {
        console.warn('Screenshot process failed:', screenshotError);
        // Don't fail the entire save process if screenshot fails
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
    handleSave,
    handleInputChange,
    getPageTitle,
    getCourseDomain,
  };
};