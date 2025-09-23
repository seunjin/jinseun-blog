declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { PostMetadata } from "./content/types";

  export const metadata: PostMetadata;
  const Component: ComponentType;
  export default Component;
}
