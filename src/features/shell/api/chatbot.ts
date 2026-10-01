import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type ChatbotAnswer = components['schemas']['ChatbotAnswer'];

/** `POST /chatbot/ask` — public RAG chatbot (mounted outside `/frontend`). */
export const askChatbot = (question: string, sessionId?: string | null) =>
  api.post<ChatbotAnswer>('/chatbot/ask', sessionId ? { question, sessionId } : { question }, {
    auth: false,
  });
