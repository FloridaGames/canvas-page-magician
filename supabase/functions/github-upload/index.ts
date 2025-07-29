import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubUploadRequest {
  fileName: string;
  fileContent: string; // base64 encoded
  folderPath?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      fileName, 
      fileContent, 
      folderPath = 'src/screenshots',
      owner = 'FloridaGames',
      repo = 'canvas-page-magician',
      branch = 'main'
    }: GitHubUploadRequest = await req.json();

    if (!fileName || !fileContent) {
      throw new Error('fileName and fileContent are required');
    }

    const token = Deno.env.get('GITHUB_PERSONAL_ACCESS_TOKEN');
    if (!token) {
      throw new Error('GitHub Personal Access Token not configured');
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}/${fileName}`;

    console.log(`Uploading file to: ${apiUrl}`);

    // Check if the file already exists to get its SHA
    let sha = null;
    try {
      const existing = await fetch(apiUrl, {
        headers: { 
          'Authorization': `token ${token}`,
          'User-Agent': 'Supabase-Edge-Function'
        }
      });
      
      if (existing.ok) {
        const data = await existing.json();
        sha = data.sha;
        console.log(`File exists, updating with SHA: ${sha}`);
      }
    } catch (err) {
      console.log('File does not exist, creating new file');
    }

    // Upload (create or update) the file
    const uploadPayload = {
      message: `Upload ${fileName} via Canvas Page Magician`,
      content: fileContent,
      branch: branch,
      ...(sha ? { sha } : {})
    };

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function'
      },
      body: JSON.stringify(uploadPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GitHub API error:', error);
      throw new Error(`GitHub API error: ${error.message || response.status}`);
    }

    const result = await response.json();
    
    // Return the download URL for the uploaded file
    const fileUrl = result.content.download_url;
    
    console.log(`File uploaded successfully: ${fileUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        fileUrl: fileUrl,
        fileName: fileName,
        sha: result.content.sha
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in github-upload:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});