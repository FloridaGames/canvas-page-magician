import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageCreateRequest {
  domain: string;
  courseId: string;
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
    const { domain, courseId, pageData }: PageCreateRequest = await req.json();

    if (!domain || !courseId || !pageData) {
      throw new Error('Domain, course ID, and page data are required');
    }

    if (!pageData.title?.trim()) {
      throw new Error('Page title is required');
    }

    const apiKey = Deno.env.get('CANVAS_API_KEY');
    if (!apiKey) {
      throw new Error('Canvas API key not configured');
    }

    // Construct Canvas API URL for creating a page
    const apiUrl = `https://${domain}/api/v1/courses/${courseId}/pages`;

    console.log(`Creating page at: ${apiUrl}`);

    // Prepare the Canvas API payload
    const canvasPayload = {
      'wiki_page[title]': pageData.title,
      'wiki_page[body]': pageData.body,
      'wiki_page[published]': pageData.published,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
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
      if (response.status === 422) {
        const errorData = await response.json();
        const errorMsg = errorData.errors ? 
          Object.values(errorData.errors).flat().join(', ') : 
          'Validation error';
        throw new Error(`Validation error: ${errorMsg}`);
      }
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const createdPage = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        page: {
          page_id: createdPage.page_id,
          title: createdPage.title,
          body: createdPage.body,
          published: createdPage.published,
          url: createdPage.url,
          created_at: createdPage.created_at,
          updated_at: createdPage.updated_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in canvas-page-create:', error);
    
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