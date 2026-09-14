"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import axios from "axios";

const QUICK_PROMPTS = [
  { label: "Japan 7 Days", text: "Plan a complete 7 days Japan trip including flights, hotels and sightseeing under 2 lakhs." },
  { label: "Dubai 5 Days", text: "Plan a 5 days Dubai trip with flights, hotels and sightseeing." },
  { label: "Top Hotels", text: "Suggest top-rated hotels in Tokyo, Dubai and Bangkok with booking links and price ranges." },
  { label: "Global Flight Routes", text: "Give me all country flight info and popular flight routes." },
];

const AGENT_STEPS = [
  { name: "Flight Agent", icon: "✈️", desc: "AviationStack & IATA" },
  { name: "Hotel Agent", icon: "🏨", desc: "Tavily Web Search" },
  { name: "Travel Planner", icon: "🗓️", desc: "Google GenAI Synthesis" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Silently pre-warm backend server when the app is first opened
    axios.get("/api/ai").catch(() => { });
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
    setCopied(false);

    try {
      const res = await axios.post("/api/ai", { message }, { signal: controller.signal });
      const data = res.data;

      if (!data.success) {
        setError(data.error || "Something went wrong.");
        return;
      }

      let answerText = data.answer;
      if (Array.isArray(answerText)) {
        answerText = answerText
          .map((item: any) => (typeof item === "string" ? item : item?.text || JSON.stringify(item)))
          .join("\n");
      } else if (typeof answerText === "object" && answerText !== null) {
        answerText = answerText.text || JSON.stringify(answerText);
      }

      setResult(answerText || "No answer received from AI.");
      setThreadId(data.thread_id);

      // Scroll to result after state update
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
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

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas)] text-[var(--ink)] selection:bg-[#3ecf8e]/30 selection:text-[#171717]">
      {/* Supabase-inspired Top Navigation (nav-bar-light) */}
      <header className="border-b border-[var(--hairline-cool)] sticky top-0 z-50 bg-[var(--canvas)]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 font-medium text-base tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3ecf8e] inline-block shadow-[0_0_8px_#3ecf8e]" />
            <span className="font-semibold text-lg text-[var(--ink)]">TripMate</span>
            <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-[var(--canvas-soft)] text-[var(--ink-mute)] border border-[var(--hairline-cool)]">
              Multi-Agent v0.1
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-[var(--ink-mute)]">
              <span className="w-2 h-2 rounded-full bg-[#3ecf8e] animate-pulse" />
              LangGraph Engine Active
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="bg-[#3ecf8e] hover:bg-[#24b47e] text-[#171717] font-medium text-xs px-3.5 py-1.5 rounded-[6px] transition-all shadow-xs cursor-pointer"
            >
              New Trip
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 rounded-full px-3.5 py-1 text-xs font-medium text-[#24b47e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
            TripMate AI — Multi-Agent Travel Engine
          </div>

          <h1 className="text-3xl sm:text-5xl font-medium tracking-display text-[var(--ink)] leading-[1.15]">
            Plan Your Perfect Trip with Autonomous AI Agents
          </h1>

          <p className="text-sm sm:text-base text-[var(--ink-mute)] max-w-2xl mx-auto leading-relaxed">
            Search live flights, discover top hotels with verified booking links, and synthesize complete travel itineraries powered by LangGraph and Google GenAI.
          </p>
        </section>

        {/* Agent Workspace Card (card-feature-light) */}
        <section className="border border-[var(--hairline)] rounded-[12px] bg-[var(--canvas)] p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--hairline-cool)] pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-medium text-[var(--ink)]">Where do you want to go?</h2>
              <p className="text-xs text-[var(--ink-mute)] mt-0.5">
                Describe your destination, trip length, budget, or preferred travel style.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--ink-mute)] shrink-0 font-mono bg-[var(--canvas-soft)] border border-[var(--hairline-cool)] px-2.5 py-1 rounded-[4px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
              Ready
            </div>
          </div>

          {/* Textarea Input Section */}
          <div className="space-y-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Plan a complete 7 days Japan trip including flights, hotels and sightseeing under 2 lakhs..."
              rows={3}
              className="w-full resize-none border border-[var(--hairline-strong)] rounded-[6px] p-3.5 text-sm outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] transition-all bg-[var(--canvas-soft)] placeholder:text-[var(--ink-faint)] font-sans"
            />

            <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
              {loading ? (
                <>
                  <button
                    disabled
                    className="flex-1 bg-[#3ecf8e]/70 text-[#171717] font-medium text-xs rounded-[6px] py-2.5 px-4 flex items-center justify-center gap-2 cursor-wait"
                  >
                    <span className="w-3.5 h-3.5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                    Executing Multi-Agent Workflow...
                  </button>
                  <button
                    type="button"
                    onClick={cancelRequest}
                    className="border border-red-500/30 text-red-600 hover:bg-red-50 font-medium text-xs rounded-[6px] px-4 py-2.5 transition-colors cursor-pointer"
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
                    className="flex-1 bg-[#3ecf8e] hover:bg-[#24b47e] active:bg-[#24b47e] text-[#171717] font-medium text-xs rounded-[6px] py-2.5 px-4 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-xs cursor-pointer"
                  >
                    Generate Travel Plan
                  </button>
                  {input.trim() && (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      className="border border-[var(--hairline-strong)] hover:bg-[var(--canvas-soft)] text-[var(--ink-mute)] hover:text-[var(--ink)] font-medium text-xs rounded-[6px] px-4 py-2.5 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Prompt Pills (pill-tag-soft) */}
          <div className="pt-2 border-t border-[var(--hairline-cool)]">
            <span className="text-xs text-[var(--ink-mute)] font-medium block mb-2">Quick Prompts:</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setInput(p.text)}
                  className="bg-[var(--canvas-soft)] hover:bg-[var(--canvas)] text-[var(--ink)] border border-[var(--hairline-cool)] hover:border-[var(--hairline-strong)] text-xs rounded-full px-3 py-1 transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* LangGraph 4-Agent Workflow Progress Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[var(--hairline-cool)]">
            {AGENT_STEPS.map((step, idx) => (
              <div
                key={step.name}
                className={`p-2.5 rounded-[6px] border text-xs transition-all ${loading
                  ? "border-[#3ecf8e]/50 bg-[#3ecf8e]/5 animate-pulse"
                  : result
                    ? "border-[#3ecf8e]/40 bg-[#3ecf8e]/5"
                    : "border-[var(--hairline-cool)] bg-[var(--canvas-soft)]"
                  }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                  <span>{step.icon}</span>
                  <span>{step.name}</span>
                </div>
                <div className="text-[11px] text-[var(--ink-mute)] mt-0.5">{step.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Error Section */}
        {error && (
          <section className="border border-red-300 rounded-[8px] p-4 bg-red-50/50 text-red-700 text-xs sm:text-sm font-medium">
            ⚠️ {error}
          </section>
        )}

        {/* AI Travel Plan Result Display */}
        {result && (
          <section ref={resultRef} className="space-y-4 scroll-mt-20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline-cool)] pb-3">
              <div>
                <h2 className="text-lg font-medium tracking-tight text-[var(--ink)]">Your AI Travel Plan</h2>
                {threadId && (
                  <span className="text-xs font-mono text-[var(--ink-mute)] mt-0.5 block">
                    Session Thread: {threadId}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="border border-[var(--hairline-strong)] hover:bg-[var(--canvas-soft)] rounded-[6px] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition-colors cursor-pointer"
                >
                  {copied ? "✓ Copied" : "Copy Markdown"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="border border-[var(--hairline-strong)] hover:bg-[var(--canvas-soft)] rounded-[6px] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition-colors cursor-pointer"
                >
                  Print Plan
                </button>
              </div>
            </div>

            <div
              className="border border-[var(--hairline)] rounded-[12px] p-6 sm:p-8 bg-[var(--canvas)] markdown shadow-xs"
              dangerouslySetInnerHTML={{ __html: marked.parse(result, { breaks: true }) }}
            />
          </section>
        )}

        {/* Feature Grid — Architecture Overview (card-feature-light & card-feature-dark) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          <div className="border border-[var(--hairline)] rounded-[12px] p-6 bg-[var(--canvas)] space-y-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#3ecf8e]/10 text-[#24b47e] flex items-center justify-center text-sm font-bold">
              ✈️
            </div>
            <h3 className="text-base font-medium text-[var(--ink)]">Flight Intelligence</h3>
            <p className="text-xs text-[var(--ink-mute)] leading-relaxed">
              Real-time flight routes and airport lookups via AviationStack, pycountry, and airportsdata IATA resolution.
            </p>
          </div>

          <div className="border border-[var(--hairline)] rounded-[12px] p-6 bg-[var(--canvas)] space-y-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#3ecf8e]/10 text-[#24b47e] flex items-center justify-center text-sm font-bold">
              🏨
            </div>
            <h3 className="text-base font-medium text-[var(--ink)]">Live Hotel Search</h3>
            <p className="text-xs text-[var(--ink-mute)] leading-relaxed">
              Queries Tavily API to fetch top-rated hotels, estimated price ranges, and verified direct booking links.
            </p>
          </div>

          <div className="border border-[var(--hairline)] rounded-[12px] p-6 bg-[var(--canvas-night)] text-[var(--on-dark)] space-y-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#3ecf8e] text-[#171717] flex items-center justify-center text-sm font-bold">
              🧠
            </div>
            <h3 className="text-base font-medium text-white">LangGraph State Graph</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Sequential 4-agent state graph compiled with MemorySaver checkpointer for thread-safe session execution.
            </p>
          </div>
        </section>
      </main>

      {/* Supabase-inspired Footer (footer-light) */}
      <footer className="border-t border-[var(--hairline-cool)] bg-[var(--canvas-soft)] text-[var(--ink-mute)] text-xs py-10 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-[var(--ink)]">
            <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
            <span>TripMate AI</span>
            <span className="text-[11px] font-mono text-[var(--ink-mute)] font-normal">
              © {new Date().getFullYear()}
            </span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-[var(--ink-mute)]">
            Built with Next.js 16, FastAPI, LangGraph, Google GenAI (Gemini 2.5), Tavily & AviationStack
          </div>
        </div>
      </footer>
    </div>
  );
}

