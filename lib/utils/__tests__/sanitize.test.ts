import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeHTML } from "../sanitize";

describe("sanitizeText", () => {
  it("removes HTML tags from text", () => {
    const input = "<script>alert('xss')</script>Hello World";
    const result = sanitizeText(input);

    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
    expect(result).toContain("Hello World");
  });

  it("removes dangerous attributes", () => {
    const input = '<a href="javascript:alert(1)">Click me</a>';
    const result = sanitizeText(input);

    expect(result).not.toContain("javascript:");
    expect(result).toContain("Click me");
  });

  it("preserves plain text", () => {
    const input = "This is plain text with no HTML";
    const result = sanitizeText(input);

    expect(result).toBe(input);
  });

  it("handles empty strings", () => {
    const result = sanitizeText("");

    expect(result).toBe("");
  });

  it("removes all HTML tags including safe ones", () => {
    const input = "<p>Hello <strong>World</strong></p>";
    const result = sanitizeText(input);

    expect(result).not.toContain("<p>");
    expect(result).not.toContain("<strong>");
    expect(result).toContain("Hello World");
  });

  it("handles special characters", () => {
    const input = "Price: ₦1,500,000 & more!";
    const result = sanitizeText(input);

    expect(result).toBe(input);
  });
});

describe("sanitizeHTML", () => {
  it("allows safe HTML tags", () => {
    const input = "<p>Hello <strong>World</strong></p>";
    const result = sanitizeHTML(input);

    expect(result).toContain("<p>");
    expect(result).toContain("<strong>");
    expect(result).toContain("Hello");
  });

  it("removes dangerous script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHTML(input);

    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>Hello</p>");
  });

  it("removes dangerous event handlers", () => {
    const input = '<a href="#" onclick="alert(1)">Click</a>';
    const result = sanitizeHTML(input);

    expect(result).not.toContain("onclick");
    expect(result).toContain("Click");
  });

  it("allows safe href attributes", () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHTML(input);

    expect(result).toContain('href="https://example.com"');
    expect(result).toContain("Link");
  });

  it("handles empty strings", () => {
    const result = sanitizeHTML("");

    expect(result).toBe("");
  });
});
