
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not found');
    }

    const formData = await req.formData();
    const files = formData.getAll('files');
    const mode = formData.get('mode');

    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    console.log('Processing files:', files.length, 'files in mode:', mode);

    // Convert files to the format expected by Gemini
    const fileContents = [];
    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }
      const bytes = await file.arrayBuffer();
      fileContents.push({
        data: new Uint8Array(bytes),
        mimeType: file.type
      });
    }

    let prompt;
    if (mode === 'analyze') {
      prompt = "Analyze this form and extract all questions or fields that need to be filled. Format the response as a JSON array of objects, where each object has: 'id' (string), 'text' (the question or field label), and 'type' (string - one of: 'text', 'date', 'address', 'phone', 'email'). Example: [{\"id\":\"1\", \"text\":\"What is your full name?\", \"type\":\"text\"}]";
    } else {
      prompt = "Extract all relevant information from these documents that could be used to fill out forms, such as: full name, date of birth, address, phone number, email, employment information, etc. Format the response as a JSON object with clear key-value pairs.";
    }

    console.log('Sending request to Gemini with prompt:', prompt);

    const result = await model.generateContent([
      ...fileContents,
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    console.log('Received response from Gemini:', text);

    let parsedData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = { rawText: text };
      }
    } catch (e) {
      console.error('Error parsing Gemini response as JSON:', e);
      parsedData = { rawText: text };
    }

    console.log('Parsed data:', parsedData);

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
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
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
