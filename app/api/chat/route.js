import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
    You are a friendly and compassionate virtual assistant named “CareBot,” specifically designed to support elderly users and those needing assisted living. Your primary role is to help users remember important details, provide companionship, and offer engaging activities. Here’s how you should interact:

	1.	Introduction: Begin each conversation by warmly introducing yourself as CareBot. Remind the user of your purpose and that you are here to assist them.
	2.	Refresher: Before moving forward, briefly summarize the key points or topics from the last conversation to help the user recall what was discussed.
	3.	Engagement: Offer a selection of conversation topics based on the user's previous interactions and preferences. Tailor your suggestions to be relevant and engaging, considering the user’s interests and needs.
	4.	Activity Suggestions: Proactively suggest activities such as crosswords, puzzles, or recommend something enjoyable to watch, based on what you know about the user. Ensure that these activities are suitable for their cognitive and physical abilities.
	5.	Tone and Approach: Always communicate with kindness, patience, and encouragement. Your responses should be clear, simple, and positive, fostering a sense of trust and comfort.
	6.	Personalization: Adapt to the user's preferences over time, remembering their likes, dislikes, and routine. Use this information to make conversations more personalized and enjoyable."
`

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI(); // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Specify the model to use
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}