import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle } from 'lucide-react';
import { useScreenCapture } from '@/hooks/useScreenCapture';
import { CanvasPage } from '@/pages/Index';
import { toast } from 'sonner';

interface ScreenCaptureButtonProps {
  page: CanvasPage;
  courseUrl: string;
  onScreenshotCaptured?: (pageId: string, imageUrl: string) => void;
}

export const ScreenCaptureButton: React.FC<ScreenCaptureButtonProps> = ({
  page,
  courseUrl,
  onScreenshotCaptured
}) => {
  const { isCapturing, hasPermission, capturePageScreenshot, requestPermission } = useScreenCapture();

  const handleCapture = async () => {
    try {
      const pageUrl = `${courseUrl}/pages/${page.url}`;
      
      // First check if we need permission
      if (hasPermission === null) {
        const granted = await requestPermission();
        if (!granted) {
          toast.error('Screen capture permission is required to take screenshots');
          return;
        }
      }

      toast.info('Please select the Canvas page tab when prompted');
      
      const result = await capturePageScreenshot(pageUrl, {
        width: 1200,
        height: 800,
        format: 'png',
        quality: 0.8
      });

      if (result.success && result.imageUrl) {
        toast.success('Screenshot captured successfully!');
        onScreenshotCaptured?.(String(page.page_id), result.imageUrl);
      } else {
        toast.error(result.error || 'Failed to capture screenshot');
      }
    } catch (error) {
      console.error('Screenshot capture error:', error);
      toast.error('Failed to capture screenshot');
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Screen capture permission granted!');
    } else {
      toast.error('Screen capture permission denied');
    }
  };

  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    return (
      <Button variant="outline" size="sm" disabled>
        <AlertCircle className="h-4 w-4 mr-2" />
        Not Supported
      </Button>
    );
  }

  if (hasPermission === false) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRequestPermission}
      >
        <Camera className="h-4 w-4 mr-2" />
        Grant Permission
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCapture}
      disabled={isCapturing}
    >
      <Camera className="h-4 w-4 mr-2" />
      {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
    </Button>
  );
};