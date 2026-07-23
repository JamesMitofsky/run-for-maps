import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiTimeoutError } from "@/lib/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("fetches with same-origin cookies included by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/osm/status");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/osm/status");
    expect(init.credentials).toBe("include");
  });

  it("respects an explicit credentials override", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/osm/status", { credentials: "omit" });
    expect(fetchMock.mock.calls[0][1].credentials).toBe("omit");
  });

  it("forwards the path, method and body untouched", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/osm/edit", { method: "POST", body: "{}" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/osm/edit");
    expect(init.method).toBe("POST");
    expect(init.body).toBe("{}");
  });

  it("does not pass a signal when no timeout is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/osm/status");
    expect(fetchMock.mock.calls[0][1].signal).toBeUndefined();
  });

  it("aborts with ApiTimeoutError when the request outlives timeoutMs", async () => {
    vi.useFakeTimers();
    // A fetch that only rejects once its signal aborts — mimics a hung backend.
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const p = apiFetch("/api/fountains", {}, { timeoutMs: 20_000 });
    const assertion = expect(p).rejects.toBeInstanceOf(ApiTimeoutError);
    await vi.advanceTimersByTimeAsync(20_000);
    await assertion;
    vi.useRealTimers();
  });

  it("propagates a real response before the timeout fires", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const r = await apiFetch("/api/fountains", {}, { timeoutMs: 20_000 });
    expect(r.status).toBe(200);
    // A signal is wired up so the timeout can abort a hung request.
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
