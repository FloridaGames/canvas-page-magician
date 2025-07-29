import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScreenshotRequest {
  pageUrl: string;
  pageId: string | number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageUrl, pageId }: ScreenshotRequest = await req.json();

    if (!pageUrl || !pageId) {
      return new Response(
        JSON.stringify({ error: 'Missing pageUrl or pageId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating unique image for page ${pageId}: ${pageUrl}`);

    // Generate a unique SVG image based on page ID and title
    const idString = String(pageId);
    const hash = idString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Create color scheme based on page ID
    const hue = hash % 360;
    const saturation = 50 + (hash % 30);
    const lightness = 60 + (hash % 20);
    
    // Create a unique pattern based on page ID
    const pattern1 = (hash % 4) + 1;
    const pattern2 = ((hash * 3) % 4) + 1;
    
    // Extract page title from URL for display
    const pageTitle = pageUrl.split('/pages/')[1]?.replace(/-/g, ' ')?.substring(0, 20) || `Page ${pageId}`;
    
    // Create SVG image
    const svgContent = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:hsl(${hue}, ${saturation}%, ${lightness}%);stop-opacity:1" />
            <stop offset="100%" style="stop-color:hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness - 10}%);stop-opacity:1" />
          </linearGradient>
          <pattern id="pattern1" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="${pattern1 * 3}" fill="rgba(255,255,255,0.1)"/>
          </pattern>
          <pattern id="pattern2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="30" height="30" fill="rgba(255,255,255,0.05)"/>
          </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bg)"/>
        
        <!-- Patterns -->
        <rect width="100%" height="100%" fill="url(#pattern1)"/>
        <rect width="100%" height="100%" fill="url(#pattern2)"/>
        
        <!-- Geometric shapes for visual interest -->
        <circle cx="${80 + (hash % 50)}" cy="${60 + (hash % 40)}" r="${20 + (hash % 15)}" fill="rgba(255,255,255,0.15)"/>
        <circle cx="${320 - (hash % 50)}" cy="${200 + (hash % 40)}" r="${15 + (hash % 10)}" fill="rgba(255,255,255,0.1)"/>
        
        <!-- Canvas-style header bar -->
        <rect x="0" y="0" width="100%" height="50" fill="rgba(0,0,0,0.1)"/>
        <circle cx="20" cy="25" r="6" fill="rgba(255,255,255,0.3)"/>
        <circle cx="40" cy="25" r="6" fill="rgba(255,255,255,0.3)"/>
        <circle cx="60" cy="25" r="6" fill="rgba(255,255,255,0.3)"/>
        
        <!-- Page identifier -->
        <text x="200" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="rgba(0,0,0,0.7)">Canvas Page</text>
        <text x="200" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="rgba(0,0,0,0.6)">${pageTitle}</text>
        <text x="200" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="rgba(0,0,0,0.5)">ID: ${pageId}</text>
        
        <!-- Content area simulation -->
        <rect x="20" y="140" width="360" height="120" rx="5" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        
        <!-- Simulated content lines -->
        <rect x="40" y="160" width="${200 + (hash % 100)}" height="8" rx="2" fill="rgba(255,255,255,0.3)"/>
        <rect x="40" y="175" width="${150 + (hash % 80)}" height="8" rx="2" fill="rgba(255,255,255,0.25)"/>
        <rect x="40" y="190" width="${180 + (hash % 90)}" height="8" rx="2" fill="rgba(255,255,255,0.3)"/>
        <rect x="40" y="205" width="${120 + (hash % 70)}" height="8" rx="2" fill="rgba(255,255,255,0.2)"/>
      </svg>
    `;

    // Convert SVG to base64 data URL
    const base64SVG = btoa(svgContent);
    const dataUrl = `data:image/svg+xml;base64,${base64SVG}`;

    console.log(`Successfully generated unique image for page ${pageId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: dataUrl,
        isFallback: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating image:', error);
    
    // Return placeholder image as fallback
    const placeholderImages = [
      'photo-1488590528505-98d2b5aba04b', // laptop
      'photo-1486312338219-ce68d2c6f44d', // macbook pro
      'photo-1487058792275-0ad4aaf24ca7', // colorful code
      'photo-1498050108023-c5249f4df085', // code screen
      'photo-1473091534298-04dcbce3278c'  // stylus tablet
    ];
    
    const idString = String(pageId || 'default');
    const hash = idString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % placeholderImages.length;
    const fallbackUrl = `https://images.unsplash.com/${placeholderImages[index]}?w=400&h=300&fit=crop`;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: fallbackUrl,
        isFallback: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});