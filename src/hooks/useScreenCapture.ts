import { useState, useCallback } from 'react';

interface ScreenCaptureOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
}

interface CaptureResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const useScreenCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.warn('Screen Capture API not supported');
        return false;
      }

      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Permission denied or error:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const capturePageScreenshot = useCallback(async (
    pageUrl: string,
    options: ScreenCaptureOptions = {}
  ): Promise<CaptureResult> => {
    setIsCapturing(true);
    
    try {
      // Check if we have permission
      if (hasPermission === false) {
        return {
          success: false,
          error: 'Screen capture permission denied'
        };
      }

      if (hasPermission === null) {
        const permission = await requestPermission();
        if (!permission) {
          return {
            success: false,
            error: 'Screen capture permission required'
          };
        }
      }

      // Open the Canvas page in a new window/tab
      const popup = window.open(pageUrl, '_blank', 'width=1200,height=800');
      
      if (!popup) {
        return {
          success: false,
          error: 'Popup blocked - please allow popups for this site'
        };
      }

      // Wait for the page to load
      await new Promise((resolve) => {
        const checkLoaded = () => {
          try {
            if (popup.document && popup.document.readyState === 'complete') {
              resolve(true);
            } else {
              setTimeout(checkLoaded, 100);
            }
          } catch (e) {
            // Cross-origin error - assume loaded after a delay
            setTimeout(resolve, 3000);
          }
        };
        checkLoaded();
      });

      // Additional delay to ensure content is rendered
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: options.width || 1200 },
          height: { ideal: options.height || 800 }
        },
        audio: false,
      });

      // Create video element to capture the stream
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true);
      });

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      // Close the popup
      popup.close();

      // Convert canvas to blob/dataURL
      const format = options.format || 'png';
      const quality = options.quality || 0.8;
      
      const imageUrl = canvas.toDataURL(`image/${format}`, quality);

      return {
        success: true,
        imageUrl
      };

    } catch (error) {
      console.error('Screen capture failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Screen capture failed'
      };
    } finally {
      setIsCapturing(false);
    }
  }, [hasPermission, requestPermission]);

  const captureCurrentTab = useCallback(async (
    options: ScreenCaptureOptions = {}
  ): Promise<CaptureResult> => {
    setIsCapturing(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return {
          success: false,
          error: 'Screen Capture API not supported'
        };
      }

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: options.width || 1200 },
          height: { ideal: options.height || 800 }
        },
        audio: false,
      });

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true);
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture frame
      ctx.drawImage(video, 0, 0);

      // Stop stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to image
      const format = options.format || 'png';
      const quality = options.quality || 0.8;
      const imageUrl = canvas.toDataURL(`image/${format}`, quality);

      return {
        success: true,
        imageUrl
      };

    } catch (error) {
      console.error('Screen capture failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Screen capture failed'
      };
    } finally {
      setIsCapturing(false);
    }
  }, []);

  return {
    isCapturing,
    hasPermission,
    requestPermission,
    capturePageScreenshot,
    captureCurrentTab
  };
};