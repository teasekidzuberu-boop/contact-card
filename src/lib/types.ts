export interface PublicProfile {
  slug: string;
  full_name: string;
  title: string;
  organization: string;
  bio: string;
  /** Call / SMS number. */
  phone: string;
  /** WhatsApp number for wa.me links (may differ from phone). */
  whatsapp_number: string;
  whatsapp_message: string;
  email: string;
  location: string;
  website: string;
  avatar_path: string | null;
  published: boolean;
  brand_color: string;
  qr_url: string;
}

export interface SocialLink {
  id?: string;
  platform: string;
  url: string;
  position: number;
}
