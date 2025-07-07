import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Eye, FileText } from "lucide-react";

interface PageDetailsCardProps {
  title: string;
  published: boolean;
  onInputChange: (field: string, value: string | boolean) => void;
}

export const PageDetailsCard = ({ title, published, onInputChange }: PageDetailsCardProps) => {
  return (
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
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Enter page title..."
            className="h-12"
          />
        </div>

        <div className="flex items-center space-x-3">
          <Switch
            id="published"
            checked={published}
            onCheckedChange={(checked) => onInputChange('published', checked)}
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
  );
};