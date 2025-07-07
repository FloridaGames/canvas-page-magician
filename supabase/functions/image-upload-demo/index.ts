import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageUploadRequest {
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
    const { imageFile, fileName, mimeType }: ImageUploadRequest = await req.json();

    if (!imageFile || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing image upload: ${fileName}`);

    // Convert base64 to blob for processing
    const base64Data = imageFile.split(',')[1] || imageFile;
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    // Simulate image processing and generate a unique file ID
    const fileId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Create a simulated upload URL (this could be to any storage service)
    const uploadUrl = `https://demo-storage.example.com/uploads/${fileId}/${fileName}`;
    
    console.log('Image upload simulation completed successfully:', {
      fileId,
      fileName,
      size: bytes.length,
      uploadUrl
    });

    // Return the simulated upload response
    return new Response(
      JSON.stringify({
        success: true,
        fileId: fileId,
        fileName: fileName,
        url: uploadUrl,
        size: bytes.length,
        mimeType: mimeType,
        uploadedAt: timestamp,
        message: 'Image uploaded successfully to demo storage'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in image-upload-demo:', error);
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