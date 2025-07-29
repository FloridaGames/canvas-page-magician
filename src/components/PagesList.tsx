import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Plus, 
  Copy, 
  Edit3, 
  Search, 
  Eye, 
  EyeOff,
  Loader2,
  RefreshCw,
  Grid3X3,
  List,
  ChevronUp,
  ChevronDown
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<"title" | "created_at" | "updated_at" | "published">("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Get random screenshot from Canvas screenshots folder
  const getCanvasScreenshot = (pageId: string | number): string => {
    // Sample screenshot filenames from the Canvas folder
    const screenshots = [
      'screenshot1.png',
      'screenshot2.png', 
      'screenshot3.png',
      'screenshot4.png',
      'screenshot5.png',
      'screenshot6.png',
      'screenshot7.png',
      'screenshot8.png',
      'screenshot9.png',
      'screenshot10.png'
    ];
    
    const idString = String(pageId);
    const hash = idString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % screenshots.length;
    
    // Use the Canvas screenshots folder URL
    return `https://tilburguniversity.instructure.com/courses/21071/files/folder/screenshots/${screenshots[index]}`;
  };

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

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAndFilteredPages = [...pages]
    .filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPublished = !showPublishedOnly || page.published;
      return matchesSearch && matchesPublished;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case "updated_at":
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        case "published":
          aValue = a.published;
          bValue = b.published;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
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
            {sortedAndFilteredPages.length} of {pages.length} pages
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
        
        <div className="flex items-center gap-3">
          <Button
            variant={showPublishedOnly ? "default" : "outline"}
            onClick={() => setShowPublishedOnly(!showPublishedOnly)}
          >
            {showPublishedOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showPublishedOnly ? "Published Only" : "Show All"}
          </Button>
          
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={viewMode === "list"}
              onCheckedChange={(checked) => setViewMode(checked ? "list" : "grid")}
            />
            <List className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      

      {sortedAndFilteredPages.length === 0 ? (
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
      ) : viewMode === "grid" ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedAndFilteredPages.map((page) => (
            <Card 
              key={page.page_id} 
              className="hover:shadow-md transition-all duration-200 cursor-pointer group border-2 border-muted rounded-xl overflow-hidden h-fit"
              onClick={() => onPageSelect(page)}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-start justify-between gap-2 min-h-[2.5rem]">
                  <CardTitle className="text-base font-semibold line-clamp-2 leading-tight flex-1">
                    {page.title}
                  </CardTitle>
                  <Badge 
                    variant={page.published ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0.5 flex-shrink-0 h-fit"
                  >
                    {page.published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 pt-0">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-12 rounded-md overflow-hidden flex-shrink-0 border border-muted">
                    <img 
                      src={getCanvasScreenshot(page.page_id)}
                      alt={page.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-2">
                      Update: {formatDate(page.updated_at)}
                    </p>
                    
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onPageSelect(page);
                        }}
                        className="flex-1 h-7 text-xs"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicatePage(page);
                        }}
                        className="h-7 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b font-medium text-sm">
            <div className="col-span-5">
              <button 
                className="flex items-center gap-1 hover:text-primary transition-colors"
                onClick={() => handleSort("title")}
              >
                Page title
                {sortField === "title" && (
                  sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button 
                className="flex items-center gap-1 hover:text-primary transition-colors"
                onClick={() => handleSort("created_at")}
              >
                Creation date
                {sortField === "created_at" && (
                  sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button 
                className="flex items-center gap-1 hover:text-primary transition-colors"
                onClick={() => handleSort("updated_at")}
              >
                Last edit
                {sortField === "updated_at" && (
                  sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button 
                className="flex items-center gap-1 hover:text-primary transition-colors"
                onClick={() => handleSort("published")}
              >
                Published
                {sortField === "published" && (
                  sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
            <div className="col-span-1">Actions</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y">
            {sortedAndFilteredPages.map((page) => (
              <div 
                key={page.page_id} 
                className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/30 transition-colors group cursor-pointer"
                onClick={() => onPageSelect(page)}
              >
                <div className="col-span-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={getCanvasScreenshot(page.page_id)}
                        alt={page.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                        {page.title}
                      </h3>
                      {page.body && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {page.body.replace(/<[^>]*>/g, '').substring(0, 80)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 text-sm text-muted-foreground flex items-center">
                  {formatDate(page.created_at)}
                </div>
                
                <div className="col-span-2 text-sm text-muted-foreground flex items-center">
                  {formatDate(page.updated_at)}
                </div>
                
                <div className="col-span-2 flex items-center">
                  {page.published ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700">Published</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Draft</span>
                    </div>
                  )}
                </div>
                
                <div className="col-span-1 flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPageSelect(page);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(page);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};