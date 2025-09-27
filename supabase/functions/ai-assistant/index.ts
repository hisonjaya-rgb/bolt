import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, fileData, fileName, fileType } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let systemPrompt = `You are an AI Assistant for garment production management. Help users analyze, search, and input data related to buyers, articles, BOM, QC, and shipping stored in Supabase. Answer in Bahasa Indonesia.

Available data tables:
- vendors: Data vendor/buyer (name, contact, notes)
- articles: Data artikel garmen (name, code, style, collection, sizes, due_date, vendor_id)
- article_variations: Variasi artikel dengan progress produksi (size, color, qty_order, cutting, sewing, finishing, qc, shipping)
- boms: Bill of Materials (item_name, category, size, consump, needed, receiving, balance)
- daily_reports: Laporan harian QC (date, inspector, status, checked_quantity, defect_count)
- qc_results: Hasil QC per variasi (color, size, ok, r5, r10)
- shipping: Data pengiriman (date, vendor_id, packing_list, remarks)
- shipping_list: Detail pengiriman per variasi (color, size, ok, r5, r10, total_shipping)

Bantu user dengan:
1. Analisis data produksi
2. Pencarian informasi spesifik
3. Input data baru
4. Laporan dan insight
5. Pemrosesan file yang diupload`;

    let userContent = message;
    let dataInserted = false;

    // Handle file upload
    if (fileData && fileName) {
      systemPrompt += `\n\nUser has uploaded a file: ${fileName} (${fileType}). Please analyze the file content and help them insert structured data into the appropriate Supabase tables.`;
      
      if (fileType?.includes('csv') || fileType?.includes('excel')) {
        systemPrompt += `\n\nFor CSV/Excel files, extract tabular data and suggest which table it should be inserted into. Provide the exact INSERT statements or data structure needed.`;
      } else if (fileType?.includes('pdf')) {
        systemPrompt += `\n\nFor PDF files, extract relevant text information and help structure it for database insertion.`;
      }
      
      userContent = `${message}\n\n[File uploaded: ${fileName}]`;
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { text: userContent }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, tidak ada respons dari AI.';

    // If file was uploaded, try to process and insert data
    if (fileData && fileName && fileType?.includes('csv')) {
      try {
        // Decode base64 file data
        const fileContent = atob(fileData);
        
        // Simple CSV parsing (for basic cases)
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Example: Auto-detect if it's vendor data
          if (headers.includes('name') && headers.includes('contact')) {
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim());
              if (values.length >= 2 && values[0] && values[1]) {
                const { error } = await supabase
                  .from('vendors')
                  .insert({
                    name: values[0],
                    contact: values[1],
                    notes: values[2] || null
                  });
                
                if (!error) dataInserted = true;
              }
            }
          }
          
          // Example: Auto-detect if it's article data
          else if (headers.includes('code') && headers.includes('name')) {
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim());
              if (values.length >= 2 && values[0] && values[1]) {
                const { error } = await supabase
                  .from('articles')
                  .insert({
                    code: values[0],
                    name: values[1],
                    style: values[2] || null,
                    collection: values[3] || null,
                    vendor_id: values[4] || null
                  });
                
                if (!error) dataInserted = true;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        dataInserted: dataInserted
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'Maaf, terjadi kesalahan. Silakan coba lagi.' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});