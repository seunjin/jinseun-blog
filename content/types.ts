export type PostCategory =
  | "insights"
  | "build-log"
  | "projects"
  | "timeline"
  | "resources";

export type PostMetadata = {
  slug: string;
  title: string;
  date: string;
  category: PostCategory;
  tags: string[];
  summary: string;
  heroImage?: string;
};
