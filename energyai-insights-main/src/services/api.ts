/**
 * API client placeholder. All methods return mocked data via promises
 * so the UI behaves like a real async backend. Swap the implementations
 * for fetch() calls to FastAPI when integrating.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const apiClient = {
  async get<T>(path: string, mock: T, ms = 400): Promise<T> {
    await delay(ms);
    void path;
    return mock;
  },
  async post<T>(path: string, body: unknown, mock: T, ms = 600): Promise<T> {
    await delay(ms);
    void path;
    void body;
    return mock;
  },
};

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
