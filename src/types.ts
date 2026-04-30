export interface LandingSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_date: string;
  hero_description: string;
  cta_text: string;
  hero_image: string;
  selected_images: string[];
}

export interface Question {
  id: number;
  text: string;
  type: string;
  options: string[];
}
