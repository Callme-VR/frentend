import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

    const res = await axios.post(`${API_URL}/api/travel`, {
      message,
      thread_id: body.thread_id,
    });

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
