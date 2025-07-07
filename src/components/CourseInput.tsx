import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Course } from "@/pages/Index";
import heroBanner from "@/assets/hero-banner.jpg";

interface CourseInputProps {
  onCourseSet: (course: Course) => void;
}

export const CourseInput = ({ onCourseSet }: CourseInputProps) => {
  const [courseUrl, setCourseUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const extractCourseInfo = (url: string) => {
    // Extract domain and course ID from Canvas URL
    // Example: https://tilburguniversity.instructure.com/courses/21071
    const match = url.match(/https?:\/\/([^\/]+)\/courses\/(\d+)/);
    if (!match) {
      throw new Error("Invalid Canvas course URL format");
    }
    
    const domain = match[1];
    const courseId = match[2];
    
    return { domain, courseId };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Canvas course URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { domain, courseId } = extractCourseInfo(courseUrl);
      
      // Call Supabase edge function to get course info
      const { data, error } = await supabase.functions.invoke('canvas-course-info', {
        body: { domain, courseId }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const course: Course = {
        id: courseId,
        name: data.name,
        url: courseUrl,
      };

      onCourseSet(course);
      
      toast({
        title: "Success",
        description: `Connected to ${data.name}`,
      });

    } catch (error) {
      console.error('Error connecting to course:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to connect to the Canvas course",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Hero background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5 pointer-events-none"
        style={{ backgroundImage: `url(${heroBanner})` }}
      />
      
      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-full mb-4 shadow-elegant">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Connect to Canvas Course</h2>
          <p className="text-muted-foreground">
            Enter your Canvas course URL to start managing pages
          </p>
        </div>

        <Card className="shadow-elegant backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Course URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseUrl">Canvas Course URL</Label>
                <Input
                  id="courseUrl"
                  type="url"
                  placeholder="https://your-school.instructure.com/courses/12345"
                  value={courseUrl}
                  onChange={(e) => setCourseUrl(e.target.value)}
                  className="h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Copy the URL from your Canvas course homepage
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect to Course"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted/80 backdrop-blur-sm rounded-lg">
          <h3 className="font-medium mb-2">Supported URL Formats:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• https://school.instructure.com/courses/12345</li>
            <li>• https://canvas.school.edu/courses/12345</li>
            <li>• Any standard Canvas LMS course URL</li>
          </ul>
        </div>
      </div>
    </div>
  );
};