export type Link = {
  id: string;
  user_id: string;
  slug: string;
  target_url: string;
  label: string | null;
  click_count: number;
  created_at: string;
};
