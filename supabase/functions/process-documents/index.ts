
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not found in environment variables');
      throw new Error('Gemini API key not found');
    }

    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll('files');
    const mode = formData.get('mode');

    console.log('Received request:', {
      filesCount: files.length,
      mode: mode,
      fileTypes: files.map((f: any) => f.type).join(', ')
    });

    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    // Initialize Gemini
    console.log('Initializing Gemini AI...');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Process files
    const fileContents = [];
    for (const file of files) {
      if (!(file instanceof File)) {
        console.error('Invalid file object:', file);
        continue;
      }

      try {
        console.log('Processing file:', file.name, 'type:', file.type);
        const bytes = await file.arrayBuffer();
        const uint8Array = new Uint8Array(bytes);
        
        console.log('File size:', uint8Array.length, 'bytes');
        
        fileContents.push({
          data: uint8Array,
          mimeType: file.type
        });
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        throw new Error(`Error processing file ${file.name}: ${error.message}`);
      }
    }

    if (fileContents.length === 0) {
      throw new Error('No valid files could be processed');
    }

    // Prepare prompt
    const prompt = mode === 'analyze' 
      ? "Analyze this form and extract all questions or fields that need to be filled. Return ONLY a JSON array of objects, where each object has: 'id' (string), 'text' (the question or field label). Example: [{\"id\":\"1\", \"text\":\"What is your full name?\"}]"
      : "Extract all relevant information from these documents that could be used to fill out forms. Return ONLY a JSON object with these fields if found: fullName, dateOfBirth, address, phone, email.";

    console.log('Sending request to Gemini...');

    // Generate content
    const result = await model.generateContent([
      ...fileContents,
      prompt,
    ]);

    console.log('Received response from Gemini');

    const response = await result.response;
    const text = response.text();
    
    console.log('Raw response:', text);

    // Parse response
    let parsedData;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON:', parsedData);
      } else {
        console.log('No JSON found in response, using raw text');
        // If no JSON is found, create a simple structure
        parsedData = mode === 'analyze' 
          ? [{ id: "1", text: text }]
          : { rawText: text };
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      // Provide a fallback structure
      parsedData = mode === 'analyze'
        ? [{ id: "1", text: text }]
        : { rawText: text };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedData
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in process-documents function:', error);
    
    // Return detailed error information
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});
