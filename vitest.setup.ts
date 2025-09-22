import "@testing-library/jest-dom/vitest";
import { createElement, type ReactNode } from "react";

// Simple stub for next/link to avoid Next.js runtime requirements during tests.
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href, ...rest }, children),
}));
