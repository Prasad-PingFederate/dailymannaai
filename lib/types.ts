// lib/types.ts
export interface Devotion {
  id: string;
  title: string;
  content: string;
  scripture_reference: string;
  scripture_text?: string;
  theme?: string;
  date: string;
  ai_generated: boolean;
  model_used?: string;
  created_at: string;
}

export interface PrayerRequest {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: 'health' | 'family' | 'work' | 'spiritual' | 'other';
  is_private: boolean;
  is_answered: boolean;
  prayer_count: number;
  created_at: string;
}
