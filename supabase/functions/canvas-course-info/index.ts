import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourseInfoRequest {
  domain: string;
  courseId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, courseId }: CourseInfoRequest = await req.json();

    if (!domain || !courseId) {
      throw new Error('Domain and course ID are required');
    }

    const apiKey = Deno.env.get('CANVAS_API_TOKEN');
    if (!apiKey) {
      throw new Error('Canvas API token not configured');
    }

    // Construct Canvas API URL
    const apiUrl = `https://${domain}/api/v1/courses/${courseId}`;

    console.log(`Fetching course info from: ${apiUrl}`);

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
        throw new Error('Course not found. Please check the course URL');
      }
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    const courseData = await response.json();

    return new Response(
      JSON.stringify({
        id: courseData.id,
        name: courseData.name,
        course_code: courseData.course_code,
        workflow_state: courseData.workflow_state,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in canvas-course-info:', error);
    
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