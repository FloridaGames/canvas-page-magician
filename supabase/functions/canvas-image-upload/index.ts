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

    console.log(`Starting Canvas image upload process: ${fileName} for course ${courseId}`);

    // Convert base64 to blob
    const base64Data = imageFile.split(',')[1] || imageFile;
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    console.log(`Step 1/4: Requesting upload parameters for ${fileName} (${bytes.length} bytes)`);

    // Step 1: Request upload parameters from Canvas
    const uploadRequestData = {
      name: `page-image-${Date.now()}-${fileName}`,
      size: bytes.length,
      content_type: mimeType,
      parent_folder_path: 'page_images',
    };

    const uploadResponse = await fetch(`https://${domain}/api/v1/courses/${courseId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadRequestData),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Canvas upload request failed:', errorText);
      return new Response(
        JSON.stringify({ error: `Step 1 failed - Canvas upload request: ${errorText}` }),
        { 
          status: uploadResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const uploadData = await uploadResponse.json();
    console.log('Step 2/4: Upload parameters received, uploading file data...');

    // Step 2: Upload the file to Canvas storage using the provided upload URL
    const formData = new FormData();
    
    // Add all the required fields from Canvas response
    if (uploadData.upload_params) {
      Object.entries(uploadData.upload_params).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }
    
    // Add the file
    const blob = new Blob([bytes], { type: mimeType });
    formData.append('file', blob, uploadRequestData.name);

    const fileUploadResponse = await fetch(uploadData.upload_url, {
      method: 'POST',
      body: formData,
    });

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      console.error('File upload to Canvas storage failed:', errorText);
      return new Response(
        JSON.stringify({ error: `Step 2 failed - File upload to storage: ${errorText}` }),
        { 
          status: fileUploadResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Step 3/4: File uploaded to storage, confirming with Canvas...');

    // Step 3: Confirm the upload - Canvas returns a location header for confirmation
    let fileData;
    const location = fileUploadResponse.headers.get('Location');
    
    if (location) {
      try {
        // Follow the redirect to get the final file information
        const confirmResponse = await fetch(location, {
          headers: {
            'Authorization': `Bearer ${canvasApiKey}`,
          },
        });
        
        if (confirmResponse.ok) {
          fileData = await confirmResponse.json();
          console.log('Step 4/4: Upload confirmed successfully:', {
            id: fileData.id,
            display_name: fileData.display_name,
            url: fileData.url
          });
        } else {
          const errorText = await confirmResponse.text();
          console.error('File confirmation failed:', errorText);
          throw new Error(`Step 3 failed - Confirmation: ${errorText}`);
        }
      } catch (error) {
        console.error('Error during confirmation step:', error);
        throw new Error(`Step 3 failed - Confirmation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // If no location header, try to parse upload response directly
      try {
        const responseText = await fileUploadResponse.text();
        if (responseText) {
          fileData = JSON.parse(responseText);
          console.log('File data retrieved from upload response:', fileData);
        } else {
          throw new Error('No location header and empty response body');
        }
      } catch (error) {
        console.error('Failed to parse upload response:', error);
        throw new Error('Step 3 failed - Could not retrieve file information after upload');
      }
    }

    if (!fileData || !fileData.id) {
      throw new Error('Upload process completed but file information is incomplete or missing');
    }

    console.log('Canvas image upload completed successfully:', {
      id: fileData.id,
      display_name: fileData.display_name || uploadRequestData.name,
      url: fileData.url,
      size: bytes.length
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