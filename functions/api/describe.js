// Cloudflare Pages function for image description using Anthropic Claude
import Anthropic from '@anthropic-ai/sdk';

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers for browser requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Check if API key is available
    if (!env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment variables');
      return new Response(JSON.stringify({ 
        error: 'API configuration error. Please set ANTHROPIC_API_KEY environment variable.' 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    // Parse request body
    const body = await request.json();
    const { image, imageType, maxWords = 50 } = body;

    if (!image) {
      return new Response(JSON.stringify({ 
        error: 'No image data provided' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });

    // Determine media type from imageType
    let mediaType = 'image/jpeg'; // default
    if (imageType) {
      mediaType = imageType;
    }

    // Create the prompt for accessibility description
    const prompt = `Please describe this image in detail for someone with visual impairment. Focus on:
1. Main subject and important objects
2. Colors, lighting, and atmosphere
3. Spatial relationships and composition
4. Any text visible in the image
5. Activities or actions taking place
6. Facial expressions and emotions if people are present

Keep the description clear, objective, and helpful for accessibility. Limit to approximately ${maxWords} words.`;

    // Make API call to Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: image
              }
            }
          ]
        }
      ]
    });

    // Extract description from response
    const description = response.content[0]?.text || 'Unable to generate description';

    return new Response(JSON.stringify({ 
      description,
      success: true 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    
    let errorMessage = 'Failed to process image description';
    let statusCode = 500;

    // Handle specific Anthropic API errors
    if (error.status === 401) {
      errorMessage = 'Invalid API key. Please check your Anthropic API key configuration.';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid request. Please check the image format and size.';
      statusCode = 400;
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message 
    }), {
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}