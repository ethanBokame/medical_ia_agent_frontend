// model/conversation.ts

export interface Conversation {
  id: number;
  created_at: string | Date;
  updated_at: string;
  user_id: number;
  messages?: any[];
}

export interface Message {
  id?: number;
  sender: 'user' | 'agent';
  content: string;
  conversation_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface ConversationDetail {
  id: number;
  messages: Message[];
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface ApiResponse {
  success: boolean;
  data: Conversation[];
  message: string;
}

export interface CreateConversationResponse {
  success: boolean;
  data: {
    id: number;
    created_at: string;
    updated_at: string;
    user_id: number;
    messages: any[];
  };
  message: string;
}

export interface SendMessageRequest {
  content: string;
  conversation_id: number;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    id: number;
    content: string;
    sender: 'user' | 'agent';
    conversation_id: number;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

export interface ConversationDetailResponse {
  success: boolean;
  data: ConversationDetail;
  message: string;
}