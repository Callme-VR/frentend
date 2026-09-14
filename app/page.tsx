"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import axios from "axios";

const QUICK_PROMPTS = [
  { label: "Japan Trip", text: "Plan a complete 7 days Japan trip including flights, hotels and sightseeing under 2 lakhs." },
  { label: "Dubai Trip", text: "Plan a 5 days Dubai trip with flights, hotels and sightseeing." },
  { label: "Best Hotels", text: "Suggest top-rated hotels in Tokyo, Dubai and Bangkok with booking links and price ranges." },
  { label: "Global Flights", text: "Give me all country flight info." },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Silently pre-warm backend server when the app is first opened
    axios.get("/api/ai").catch(() => {});
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setError("Plan generation cancelled.");
  }, []);

  const sendMessage = useCallback(async () => {
    const message = input.trim();
    if (!message) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);
    setThreadId(null);

    try {
      const res = await axios.post("/api/ai", { message }, { signal: controller.signal });
      const data = res.data;

      if (!data.success) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data.answer);
      setThreadId(data.thread_id);
    } catch (e) {
      if (axios.isCancel(e) || (e instanceof Error && e.name === "CanceledError")) {
        setError("Plan generation cancelled.");
      } else if (axios.isAxiosError(e) && e.response?.data?.error) {
        setError(e.response.data.error);
      } else {
        setError(e instanceof Error ? e.message : "Failed to connect to server.");
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-12 space-y-10">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 border border-[var(--border)] rounded-full px-4 py-1.5 text-sm text-[var(--muted-foreground)]">
          TripMate AI — A Multi-Agent Travel Planner
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Plan Your Perfect Trip with AI</h1>
        <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">
          Search flights, discover hotels, and generate a complete travel itinerary using a multi-agent LangGraph system.
        </p>
      </section>

      <section className="border border-[var(--border)] rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Where do you want to go?</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Example: Plan a complete 7 days Japan trip from India under 2 lakhs.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[var(--foreground)]" />
            Online
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Plan a complete 7 days Japan trip including flights, hotels and sightseeing under 2 lakhs..."
            rows={3}
            className="w-full resize-none border border-[var(--border)] rounded-lg p-3 text-sm outline-none focus:border-[var(--foreground)] transition-colors bg-transparent"
          />
          <div className="flex gap-2">
            {loading ? (
              <>
                <button
                  disabled
                  className="flex-1 border border-[var(--foreground)] rounded-lg py-2.5 text-sm font-medium opacity-70 pointer-events-none flex items-center justify-center gap-2"
                >
                  <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                  Generating...
                </button>
                <button
                  type="button"
                  onClick={cancelRequest}
                  className="border border-red-500/50 text-red-500 hover:bg-red-500/10 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="flex-1 border border-[var(--foreground)] rounded-lg py-2.5 text-sm font-medium hover:bg-[var(--foreground)] hover:text-[var(--background)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Generate Plan
                </button>
                {input.trim() && (
                  <button
                    type="button"
                    onClick={() => setInput("")}
                    className="border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => setInput(p.text)}
              className="border border-[var(--border)] rounded-full px-3 py-1 text-xs hover:bg-[var(--muted)] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <section className="border border-[var(--foreground)] rounded-xl p-4 bg-[var(--muted)]">
          <p className="text-sm">{error}</p>
        </section>
      )}

      {result && (
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Your AI Travel Plan</h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Thread ID: {threadId}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigator.clipboard.writeText(result!)}
                className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => window.print()}
                className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors"
              >
                Print
              </button>
            </div>
          </div>
          <div
            ref={resultRef}
            className="border border-[var(--border)] rounded-xl p-6 markdown"
            dangerouslySetInnerHTML={{ __html: marked.parse(result, { breaks: true }) }}
          />
        </section>
      )}

      <footer className="text-center text-xs text-[var(--muted-foreground)] pb-4">
        Built with Next.js, FastAPI, LangGraph, Google GenAI (Gemini), PostgreSQL, Tavily and AviationStack
      </footer>
    </main>
  );
}
