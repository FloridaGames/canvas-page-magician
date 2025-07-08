import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PagesListRequest {
  domain: string;
  courseId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, courseId }: PagesListRequest = await req.json();

    if (!domain || !courseId) {
      throw new Error('Domain and course ID are required');
    }

    const apiKey = Deno.env.get('CANVAS_API_KEY');
    if (!apiKey) {
      throw new Error('Canvas API key not configured');
    }

    // Construct Canvas API URL for pages with body content
    const apiUrl = `https://${domain}/api/v1/courses/${courseId}/pages?include[]=body`;

    console.log(`Fetching pages with content from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Canvas API key or unauthorized access');
      }
      if (response.status === 404) {
        throw new Error('Course not found or no access to pages');
      }
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const pagesData = await response.json();

    // For pages without full content, fetch individual page details
    const pagesWithContent = await Promise.all(
      pagesData.map(async (page: any) => {
        if (!page.body) {
          try {
            // Fetch individual page to get full content
            const pageResponse = await fetch(
              `https://${domain}/api/v1/courses/${courseId}/pages/${page.url}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (pageResponse.ok) {
              const fullPage = await pageResponse.json();
              return {
                page_id: fullPage.page_id,
                title: fullPage.title,
                body: fullPage.body || '',
                published: fullPage.published,
                url: fullPage.url,
                created_at: fullPage.created_at,
                updated_at: fullPage.updated_at,
              };
            }
          } catch (error) {
            console.log(`Failed to fetch full content for page ${page.title}:`, error);
          }
        }
        
        return {
          page_id: page.page_id,
          title: page.title,
          body: page.body || '',
          published: page.published,
          url: page.url,
          created_at: page.created_at,
          updated_at: page.updated_at,
        };
      })
    );

    return new Response(
      JSON.stringify({ pages: pagesWithContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in canvas-pages-list:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});