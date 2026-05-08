/**
 * Client per chiamare i nostri endpoint serverless.
 * Tutto passa qui, mai chiamate dirette a Anthropic/Resend dal browser.
 */

interface ChatApiResponse {
  reply: string;
  meta: {
    classification?: string;
    tags?: string[];
    urgency?: boolean;
    suggested_cta?: string;
    ask_contact_data?: boolean;
    detected_service?: string;
  };
  usage?: { inputTokens?: number; outputTokens?: number };
  stub?: boolean;
  error?: string;
}

export async function callChatApi(
  botId: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<ChatApiResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botId, messages }),
  });
  const data = await res.json();
  if (!res.ok && !data?.reply) {
    throw new Error(data?.error || "Chat API error");
  }
  return data;
}

interface SendEmailPayload {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  ruleId?: string;
  ruleName?: string;
  trigger?: string;
  leadId?: string;
  landingId?: string;
  funnelId?: string;
  conversationId?: string;
}

export async function callSendEmailApi(payload: SendEmailPayload): Promise<{
  ok: boolean;
  stub?: boolean;
  messageId?: string;
  logId?: string;
  error?: any;
}> {
  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}
