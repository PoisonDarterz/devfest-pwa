export interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  JWT_SECRET?: string;
  ANNEXHUB_API_KEY?: string;
  ANNEXHUB_EVENT_ID?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  ASSETS?: {
    fetch: (request: Request | string) => Promise<Response>;
  };
}
