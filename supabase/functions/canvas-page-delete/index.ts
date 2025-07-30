import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeletePageRequest {
  domain: string;
  courseId: string;
  pageId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, courseId, pageId }: DeletePageRequest = await req.json();

    if (!domain || !courseId || !pageId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: domain, courseId, and pageId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const canvasApiKey = Deno.env.get('CANVAS_API_KEY');
    if (!canvasApiKey) {
      return new Response(
        JSON.stringify({ error: 'Canvas API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting page ${pageId} from course ${courseId} on domain ${domain}`);

    // Call Canvas API to delete the page
    const canvasUrl = `https://${domain}/api/v1/courses/${courseId}/pages/${pageId}`;
    
    const response = await fetch(canvasUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Canvas API error:', response.status, errorText);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Page not found or already deleted' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - check Canvas API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: `Canvas API error: ${response.status} ${errorText}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const result = await response.json();
    console.log('Page deleted successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Page deleted successfully',
        deletedPage: result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in canvas-page-delete function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})