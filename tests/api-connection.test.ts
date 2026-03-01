import { describe, it, expect } from "vitest";

describe("API Connection", () => {
  it("should connect to API server health endpoint", async () => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
    
    const response = await fetch(`${apiBaseUrl}/api/health`);
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.ok).toBe(true);
    expect(data.timestamp).toBeDefined();
  });
});
