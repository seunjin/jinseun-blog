import { render, screen } from "@testing-library/react";
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
    ).toHaveAttribute("href", "#latest");
    expect(screen.getByRole("link", { name: /view roadmap/i })).toHaveAttribute(
      "href",
      "#roadmap",
    );
  });
});
