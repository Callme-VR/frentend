import axios from "axios";

const LOCAL_API = "http://127.0.0.1:8000";
const RENDER_API = "https://backend-triplanner.onrender.com";

async function getBackendUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  
  // 1. If explicit non-Render URL provided, use it
  if (envUrl && !envUrl.includes("onrender.com")) {
    return envUrl;
  }

  // 2. Try pinging local backend with a quick 300ms timeout
  try {
    const res = await fetch(`${LOCAL_API}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(300),
    });
    if (res.ok) return LOCAL_API;
  } catch {
    // Local server not running
  }

  // 3. Fallback to configured env URL or Render
  return envUrl || RENDER_API;
}

export async function GET() {
  try {
    const backendUrl = await getBackendUrl();
    const res = await axios.get(`${backendUrl}/health`, { timeout: 10000 });
    return Response.json({ success: true, backend: backendUrl, data: res.data });
  } catch {
    return Response.json({ success: false, error: "Backend warm up failed" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return Response.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    const cleanApiUrl = await getBackendUrl();
    const res = await axios.post(
      `${cleanApiUrl}/api/travel`,
      {
        message,
        thread_id: body.thread_id,
      },
      { timeout: 60000 }
    );

    return Response.json(res.data);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      return Response.json(
        {
          success: false,
          error: e.response.data?.error || "Backend request failed.",
        },
        { status: e.response.status }
      );
    }
    return Response.json(
      {
        success: false,
        error:
          e instanceof Error ? e.message : "Failed to connect to backend server.",
      },
      { status: 500 }
    );
  }
}
