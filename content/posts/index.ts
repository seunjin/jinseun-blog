import type { ComponentType } from "react";
import type { PostCategory, PostMetadata } from "../types";
import PostPandaLab, {
  metadata as pandaLabMeta,
} from "./2025-09-10-lab-notes.mdx";
import PostBuildLog, {
  metadata as buildLogMeta,
} from "./2025-09-18-build-log.mdx";
import PostWelcome, { metadata as welcomeMeta } from "./2025-09-22-welcome.mdx";

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  insights: "Insights",
  "build-log": "Build log",
  projects: "Projects",
  timeline: "Timeline",
  resources: "Resources",
};

export type PostModule = {
  metadata: PostMetadata;
  Content: ComponentType;
};

function normalize(meta: PostMetadata, Content: ComponentType): PostModule {
  return {
    metadata: meta,
    Content,
  };
}

export const posts: PostModule[] = [
  normalize(welcomeMeta, PostWelcome),
  normalize(buildLogMeta, PostBuildLog),
  normalize(pandaLabMeta, PostPandaLab),
].sort((a, b) => (a.metadata.date > b.metadata.date ? -1 : 1));

export function findPostBySlug(slug: string): PostModule | undefined {
  return posts.find((post) => post.metadata.slug === slug);
}
