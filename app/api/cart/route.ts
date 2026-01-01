export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const CART_COOKIE = "justcook_cart";

export async function GET() {
  // ⛔ Prevent execution during build
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json({ items: [] });
  }

  const cookieStore = await cookies();
  const cart = cookieStore.get(CART_COOKIE)?.value;
  return NextResponse.json({
    items: cart ? JSON.parse(cart) : [],
  });
}

export async function POST(req: Request) {
  const { item } = await req.json();

  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE)?.value;
  const items = existing ? JSON.parse(existing) : [];

  const index = items.findIndex((i: any) => i.id === item.id);

  if (index > -1) {
    items[index].quantity += item.quantity;
  } else {
    items.push(item);
  }

  await cookieStore.set(CART_COOKIE, JSON.stringify(items), {
    path: "/",
    httpOnly: true,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE)?.value;
  const items = existing ? JSON.parse(existing) : [];

  const updated = items.filter((i: any) => i.id !== id);

  await cookieStore.set(CART_COOKIE, JSON.stringify(updated), {
    path: "/",
    httpOnly: true,
  });

  return NextResponse.json({ success: true });
}
