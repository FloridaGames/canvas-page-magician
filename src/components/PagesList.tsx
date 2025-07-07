import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Plus, 
  Copy, 
  Edit3, 
  Search, 
  Eye, 
  EyeOff,
  Loader2,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Course, CanvasPage } from "@/pages/Index";

interface PagesListProps {
  course: Course;
  onPageSelect: (page: CanvasPage) => void;
  onNewPage: () => void;
  onDuplicatePage: (page: CanvasPage) => void;
}

export const PagesList = ({ course, onPageSelect, onNewPage, onDuplicatePage }: PagesListProps) => {
  const [pages, setPages] = useState<CanvasPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPublishedOnly, setShowPublishedOnly] = useState(false);

  const fetchPages = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { domain } = extractDomainFromUrl(course.url);
      
      const { data, error } = await supabase.functions.invoke('canvas-pages-list', {
        body: { domain, courseId: course.id }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPages(data.pages || []);
      
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: "Failed to Load Pages",
        description: error instanceof Error ? error.message : "Unable to fetch course pages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const extractDomainFromUrl = (url: string) => {
    const match = url.match(/https?:\/\/([^\/]+)/);
    if (!match) throw new Error('Invalid URL');
    return { domain: match[1] };
  };

  useEffect(() => {
    fetchPages();
  }, [course]);

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPublished = !showPublishedOnly || page.published;
    return matchesSearch && matchesPublished;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading course pages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Course Pages</h2>
          <p className="text-muted-foreground">
            {filteredPages.length} of {pages.length} pages
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPages(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <Button onClick={onNewPage}>
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant={showPublishedOnly ? "default" : "outline"}
          onClick={() => setShowPublishedOnly(!showPublishedOnly)}
        >
          {showPublishedOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
          {showPublishedOnly ? "Published Only" : "Show All"}
        </Button>
      </div>

      {filteredPages.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No pages found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || showPublishedOnly 
                ? "No pages match your current filters." 
                : "This course doesn't have any pages yet."}
            </p>
            <Button onClick={onNewPage}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <Card 
              key={page.page_id} 
              className="hover:shadow-card-hover transition-all duration-200 cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {page.title}
                  </CardTitle>
                  <Badge variant={page.published ? "default" : "secondary"}>
                    {page.published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Updated: {formatDate(page.updated_at)}</p>
                  {page.body && (
                    <p className="line-clamp-2 mt-1">
                      {page.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onPageSelect(page);
                    }}
                    className="flex-1"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(page);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};