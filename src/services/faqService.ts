import { supabase } from '../lib/supabase';
import type { FAQItem } from '../lib/types';

export const faqService = {
  // Fetch FAQs
  async getFAQs(): Promise<FAQItem[]> {
    try {
      const { data, error } = await supabase.from('faqs').select('*');
      if (!error && data) return data as FAQItem[];
    } catch (err) {
      console.error('Database query failed for FAQs:', err);
    }
    return [];
  },
};
