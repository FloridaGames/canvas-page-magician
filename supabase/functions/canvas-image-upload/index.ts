import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CanvasImageUploadRequest {
  domain: string;
  courseId: string;
  imageFile: string; // base64 encoded file
  fileName: string;
  mimeType: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { domain, courseId, imageFile, fileName, mimeType }: CanvasImageUploadRequest = await req.json();

    if (!domain || !courseId || !imageFile || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const canvasApiKey = Deno.env.get('CANVAS_API_KEY');
    if (!canvasApiKey) {
      console.error('CANVAS_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Canvas API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Uploading image to Canvas: ${fileName} for course ${courseId}`);

    // Convert base64 to blob
    const base64Data = imageFile.split(',')[1] || imageFile;
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    // Step 1: Request upload parameters from Canvas
    const uploadResponse = await fetch(`https://${domain}/api/v1/courses/${courseId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: fileName,
        size: bytes.length,
        content_type: mimeType,
        parent_folder_path: '/Uploaded Media',
      }),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Canvas upload request failed:', errorText);
      return new Response(
        JSON.stringify({ error: `Canvas upload request failed: ${errorText}` }),
        { 
          status: uploadResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const uploadData = await uploadResponse.json();
    console.log('Canvas upload response:', uploadData);

    // Step 2: Upload the file to Canvas using the provided upload URL
    const formData = new FormData();
    
    // Add all the required fields from Canvas response
    if (uploadData.upload_params) {
      Object.entries(uploadData.upload_params).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }
    
    // Add the file
    const blob = new Blob([bytes], { type: mimeType });
    formData.append('file', blob, fileName);

    const fileUploadResponse = await fetch(uploadData.upload_url, {
      method: 'POST',
      body: formData,
    });

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      console.error('File upload to Canvas failed:', errorText);
      return new Response(
        JSON.stringify({ error: `File upload failed: ${errorText}` }),
        { 
          status: fileUploadResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 3: Confirm the upload - Canvas returns a location header
    let fileData;
    const location = fileUploadResponse.headers.get('Location');
    
    if (location) {
      // Follow the redirect to get the final file information
      const confirmResponse = await fetch(location, {
        headers: {
          'Authorization': `Bearer ${canvasApiKey}`,
        },
      });
      
      if (confirmResponse.ok) {
        fileData = await confirmResponse.json();
        console.log('File confirmed:', fileData);
      } else {
        console.error('File confirmation failed:', await confirmResponse.text());
      }
    }

    // If no location header or confirmation failed, try to parse upload response directly
    if (!fileData) {
      try {
        const responseText = await fileUploadResponse.text();
        if (responseText) {
          fileData = JSON.parse(responseText);
        }
      } catch (error) {
        console.error('Failed to parse upload response:', error);
        throw new Error('Failed to get file information after upload');
      }
    }

    if (!fileData || !fileData.id) {
      throw new Error('Upload succeeded but file information is incomplete');
    }

    console.log('File upload completed successfully:', {
      id: fileData.id,
      display_name: fileData.display_name || fileName,
      url: fileData.url
    });

    // Return the file info in the format expected by the frontend
    return new Response(
      JSON.stringify({
        success: true,
        file: fileData,
        fileId: fileData.id,
        fileName: fileData.display_name || fileName,
        // Use the direct URL from Canvas, not a constructed preview URL
        url: fileData.url,
        // Also provide the API endpoint for Canvas-specific HTML structure
        apiEndpoint: `https://${domain}/api/v1/courses/${courseId}/files/${fileData.id}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in canvas-image-upload:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});