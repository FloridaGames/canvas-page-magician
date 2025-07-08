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
  cloudinaryFolder?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { domain, courseId, imageFile, fileName, mimeType, cloudinaryFolder }: CanvasImageUploadRequest = await req.json();

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
        parent_folder_path: '/course files/images',
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

    // Step 3: Confirm the upload (if needed)
    let fileData;
    const location = fileUploadResponse.headers.get('Location');
    
    if (location) {
      // Follow the redirect to get file information
      const confirmResponse = await fetch(location, {
        headers: {
          'Authorization': `Bearer ${canvasApiKey}`,
        },
      });
      
      if (confirmResponse.ok) {
        fileData = await confirmResponse.json();
      }
    }

    // If no location header, try to parse response directly
    if (!fileData) {
      try {
        fileData = await fileUploadResponse.json();
      } catch {
        // If response is not JSON, create a basic response
        fileData = {
          id: uploadData.id,
          filename: fileName,
          url: uploadData.upload_url,
        };
      }
    }

    console.log('File upload completed:', fileData);

    // Upload to Cloudinary if folder is specified
    let cloudinaryUrl = null;
    if (cloudinaryFolder) {
      const cloudinaryName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
      const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY');
      const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

      if (!cloudinaryName || !cloudinaryApiKey || !cloudinaryApiSecret) {
        console.error('Cloudinary credentials not found');
      } else {
        try {
          console.log(`Uploading to Cloudinary folder: ${cloudinaryFolder}`);
          
          // Generate signature for Cloudinary upload
          const timestamp = Math.round(Date.now() / 1000);
          const folderName = cloudinaryFolder.split('/').pop(); // Extract folder name from URL
          const publicId = `${folderName}/${fileName.split('.')[0]}`;
          
          const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
          const signature = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(cloudinaryApiSecret),
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
          ).then(key => 
            crypto.subtle.sign('HMAC', key, new TextEncoder().encode(paramsToSign))
          ).then(signature => 
            Array.from(new Uint8Array(signature))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
          );

          // Upload to Cloudinary
          const cloudinaryFormData = new FormData();
          cloudinaryFormData.append('file', blob);
          cloudinaryFormData.append('public_id', publicId);
          cloudinaryFormData.append('api_key', cloudinaryApiKey);
          cloudinaryFormData.append('timestamp', timestamp.toString());
          cloudinaryFormData.append('signature', signature);

          const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryName}/image/upload`,
            {
              method: 'POST',
              body: cloudinaryFormData,
            }
          );

          if (cloudinaryResponse.ok) {
            const cloudinaryData = await cloudinaryResponse.json();
            cloudinaryUrl = cloudinaryData.secure_url;
            console.log('Cloudinary upload successful:', cloudinaryUrl);
          } else {
            const errorText = await cloudinaryResponse.text();
            console.error('Cloudinary upload failed:', errorText);
          }
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        file: fileData,
        url: fileData.url || `https://${domain}/courses/${courseId}/files/${fileData.id}/preview`,
        fileId: fileData.id,
        previewUrl: `/courses/${courseId}/files/${fileData.id}/preview`,
        fileName: fileName,
        cloudinaryUrl: cloudinaryUrl,
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