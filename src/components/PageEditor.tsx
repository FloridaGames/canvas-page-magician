import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { HybridEditor } from "@/components/HybridEditor";
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  FileText, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Course, CanvasPage } from "@/pages/Index";

interface PageEditorProps {
  course: Course;
  page: CanvasPage | null;
  isNewPage: boolean;
  onBack: () => void;
}

export const PageEditor = ({ course, page, isNewPage, onBack }: PageEditorProps) => {
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

  const extractDomainFromUrl = (url: string) => {
    const match = url.match(/https?:\/\/([^\/]+)/);
    if (!match) throw new Error('Invalid URL');
    return { domain: match[1] };
  };

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{getPageTitle()}</h2>
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Page Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter page title..."
                className="h-12"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                id="published"
                checked={published}
                onCheckedChange={(checked) => handleInputChange('published', checked)}
              />
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Label htmlFor="published">
                  Publish page (make visible to students)
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Page Content</CardTitle>
              <Button 
                onClick={handleSave} 
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
              onChange={(value) => handleInputChange('body', value)}
              placeholder="Start writing your page content... The editor will automatically preserve Canvas layouts and collapsible boxes."
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};