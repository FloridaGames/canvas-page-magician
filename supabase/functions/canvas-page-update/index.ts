import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageUpdateRequest {
  domain: string;
  courseId: string;
  pageId: number;
  pageData: {
    title: string;
    body: string;
    published: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, courseId, pageId, pageData }: PageUpdateRequest = await req.json();

    if (!domain || !courseId || !pageId || !pageData) {
      throw new Error('Domain, course ID, page ID, and page data are required');
    }

    if (!pageData.title?.trim()) {
      throw new Error('Page title is required');
    }

    const apiKey = Deno.env.get('CANVAS_API_KEY');
    if (!apiKey) {
      throw new Error('Canvas API key not configured');
    }

    // Construct Canvas API URL for updating a page
    const apiUrl = `https://${domain}/api/v1/courses/${courseId}/pages/${pageId}`;

    console.log(`Updating page at: ${apiUrl}`);

    // Prepare the Canvas API payload
    const canvasPayload = {
      'wiki_page[title]': pageData.title,
      'wiki_page[body]': pageData.body,
      'wiki_page[published]': pageData.published,
    };

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(canvasPayload).toString(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Canvas API key or unauthorized access');
      }
      if (response.status === 404) {
        throw new Error('Page not found or no access to this page');
      }
      if (response.status === 422) {
        const errorData = await response.json();
        const errorMsg = errorData.errors ? 
          Object.values(errorData.errors).flat().join(', ') : 
          'Validation error';
        throw new Error(`Validation error: ${errorMsg}`);
      }
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const updatedPage = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        page: {
          page_id: updatedPage.page_id,
          title: updatedPage.title,
          body: updatedPage.body,
          published: updatedPage.published,
          url: updatedPage.url,
          created_at: updatedPage.created_at,
          updated_at: updatedPage.updated_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in canvas-page-update:', error);
    
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