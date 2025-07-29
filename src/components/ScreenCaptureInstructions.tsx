import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Monitor, MousePointer } from 'lucide-react';

export const ScreenCaptureInstructions: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          How to Capture Real Screenshots
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              1
            </div>
            <div>
              <h4 className="font-medium mb-1">Click "Capture Screenshot"</h4>
              <p className="text-sm text-muted-foreground">
                Press the camera button on any page card to start the capture process.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              2
            </div>
            <div>
              <h4 className="font-medium mb-1 flex items-center gap-1">
                <Monitor className="h-4 w-4" />
                Select Screen/Tab
              </h4>
              <p className="text-sm text-muted-foreground">
                Choose the Canvas page tab when your browser prompts for screen sharing permission.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              3
            </div>
            <div>
              <h4 className="font-medium mb-1 flex items-center gap-1">
                <MousePointer className="h-4 w-4" />
                Automatic Capture
              </h4>
              <p className="text-sm text-muted-foreground">
                The screenshot will be captured automatically and replace the generated preview.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Make sure the Canvas page is fully loaded and visible on your screen before capturing for the best results.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};