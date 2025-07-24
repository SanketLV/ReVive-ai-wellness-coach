import OpenAI from "openai";

// OpenAI client configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get embedding from OpenAI
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error getting embedding:", error);
    throw error;
  }
}

// Generate chat response from OpenAI
export async function generateChatResponse(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI wellness coach. Your role is to provide helpful, encouraging, and evidence-based advice on health, fitness, nutrition, and mental well-being. 
          
          Guidelines:
          - Be supportive and motivational
          - Provide practical, actionable advice
          - Ask clarifying questions when needed
          - Encourage professional medical consultation for serious health concerns
          - Focus on sustainable lifestyle changes
          - Be empathetic and understanding`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return (
      response.choices[0].message.content ||
      "I apologize, but I could not generate a response. Please try again."
    );
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
}

// Generate streaming chat response
export async function generateStreamingChatResponse(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI wellness coach. Your role is to provide helpful, encouraging, and evidence-based advice on health, fitness, nutrition, and mental well-being. 
          
          Guidelines:
          - Be supportive and motivational
          - Provide practical, actionable advice
          - Ask clarifying questions when needed
          - Encourage professional medical consultation for serious health concerns
          - Focus on sustainable lifestyle changes
          - Be empathetic and understanding`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error("Error generating streaming chat response:", error);
    throw error;
  }
}
