import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CanvasPage } from '@/pages/Index';

interface ScreenshotCache {
  [pageId: string]: {
    imageUrl: string;
    isFallback: boolean;
    timestamp: number;
  };
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SCREENSHOT_CACHE_KEY = 'canvas-page-screenshots';

export const usePageScreenshots = (pages: CanvasPage[], courseUrl: string) => {
  const [screenshotCache, setScreenshotCache] = useState<ScreenshotCache>({});
  const [isLoadingScreenshots, setIsLoadingScreenshots] = useState(false);

  // Load cached screenshots from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(SCREENSHOT_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Filter out expired entries
        const now = Date.now();
        const validCache: ScreenshotCache = {};
        
        Object.entries(parsedCache).forEach(([key, value]: [string, any]) => {
          if (value.timestamp && (now - value.timestamp) < CACHE_DURATION) {
            validCache[key] = value;
          }
        });
        
        setScreenshotCache(validCache);
      }
    } catch (error) {
      console.error('Error loading screenshot cache:', error);
    }
  }, []);

  // Save cache to localStorage
  const saveCache = (newCache: ScreenshotCache) => {
    try {
      localStorage.setItem(SCREENSHOT_CACHE_KEY, JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving screenshot cache:', error);
    }
  };

  // Get screenshot for a page
  const getPageScreenshot = async (page: CanvasPage): Promise<string> => {
    const cacheKey = String(page.page_id);
    
    // Check if we have a cached screenshot
    if (screenshotCache[cacheKey] && !screenshotCache[cacheKey].isFallback) {
      return screenshotCache[cacheKey].imageUrl;
    }

    try {
      setIsLoadingScreenshots(true);
      
      // Construct the full Canvas page URL
      const pageUrl = `${courseUrl}/pages/${page.url}`;
      
      const { data, error } = await supabase.functions.invoke('canvas-page-screenshot', {
        body: { 
          pageUrl, 
          pageId: page.page_id 
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success && data?.imageUrl) {
        const newCacheEntry = {
          imageUrl: data.imageUrl,
          isFallback: data.isFallback || false,
          timestamp: Date.now()
        };

        const newCache = {
          ...screenshotCache,
          [cacheKey]: newCacheEntry
        };

        setScreenshotCache(newCache);
        saveCache(newCache);
        
        return data.imageUrl;
      }
    } catch (error) {
      console.error('Error fetching screenshot:', error);
    } finally {
      setIsLoadingScreenshots(false);
    }

    // Return fallback image
    return getFallbackImage(page.page_id);
  };

  // Get fallback placeholder image
  const getFallbackImage = (pageId: string | number) => {
    const images = [
      'photo-1488590528505-98d2b5aba04b', // laptop
      'photo-1486312338219-ce68d2c6f44d', // macbook pro
      'photo-1487058792275-0ad4aaf24ca7', // colorful code
      'photo-1498050108023-c5249f4df085', // code screen
      'photo-1473091534298-04dcbce3278c'  // stylus tablet
    ];
    
    const idString = String(pageId);
    const hash = idString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % images.length;
    return `https://images.unsplash.com/${images[index]}?w=400&h=300&fit=crop`;
  };

  // Get cached screenshot or fallback
  const getCachedScreenshot = (pageId: string | number): string => {
    const cacheKey = String(pageId);
    return screenshotCache[cacheKey]?.imageUrl || getFallbackImage(pageId);
  };

  // Preload screenshots for visible pages
  const preloadScreenshots = async (visiblePages: CanvasPage[]) => {
    const promises = visiblePages
      .filter(page => {
        const cacheKey = String(page.page_id);
        return !screenshotCache[cacheKey] || screenshotCache[cacheKey].isFallback;
      })
      .slice(0, 5) // Limit to first 5 pages to avoid overwhelming
      .map(page => getPageScreenshot(page));

    await Promise.allSettled(promises);
  };

  // Update screenshot in cache
  const updateScreenshot = (pageId: string, imageUrl: string) => {
    const newCacheEntry = {
      imageUrl,
      isFallback: false,
      timestamp: Date.now()
    };

    const newCache = {
      ...screenshotCache,
      [pageId]: newCacheEntry
    };

    setScreenshotCache(newCache);
    saveCache(newCache);
  };

  return {
    getCachedScreenshot,
    getPageScreenshot,
    preloadScreenshots,
    updateScreenshot,
    isLoadingScreenshots,
    screenshotCache
  };
};