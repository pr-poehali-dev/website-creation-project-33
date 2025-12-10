export interface Message {
  id: number;
  user_id: number;
  message: string;
  media_type?: 'audio' | 'image' | 'video' | null;
  media_url?: string | null;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
  user_name?: string;
  user_avatar?: string | null;
}

export interface UserChat {
  id: number;
  name: string;
  email: string;
  unread_count: number;
  last_message_time: string | null;
  total_messages: number;
  avatar_url?: string | null;
}

export const CHAT_API_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';