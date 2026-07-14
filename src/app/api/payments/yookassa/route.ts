import { NextRequest, NextResponse } from "next/server";
import { processYookassaWebhookPayment, revalidateSubscriptionPaths } from "@/lib/subscription-payments";
import { isYookassaConfigured } from "@/lib/yookassa";

type YookassaWebhookBody = {
  event?: string;
  object?: { id?: string };
};

export async function GET() {
  return NextResponse.json(
    { error: "Webhook принимает только POST от ЮKassa" },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  if (!isYookassaConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let body: YookassaWebhookBody;
  try {
    body = (await request.json()) as YookassaWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event;
  const paymentId = body.object?.id?.trim();

  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
  }

  if (event !== "payment.succeeded" && event !== "payment.canceled") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const result = await processYookassaWebhookPayment(paymentId);
    if ("succeeded" in result && result.succeeded) {
      revalidateSubscriptionPaths();
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[yookassa/webhook]", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
