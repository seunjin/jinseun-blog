import { render, screen } from "@testing-library/react";

vi.mock("@content/posts", () => ({
  posts: [
    {
      metadata: {
        slug: "mock-post",
      },
    },
  ],
}));

import Home from "./page";

describe("Home", () => {
  it("렌딩 히어로 영역을 렌더링한다", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /jinseun blog/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/digital garden/i)).toBeInTheDocument();
  });

  it("CTA 링크를 노출한다", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", { name: /read latest updates/i }),
    ).toHaveAttribute("href", "/archive/mock-post");
    expect(
      screen.getByRole("link", { name: /browse archive/i }),
    ).toHaveAttribute("href", "/archive");
  });
});
