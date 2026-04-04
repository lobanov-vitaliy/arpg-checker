import { NextResponse } from "next/server";
import { resolveRedirect } from "@/config/redirects";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const target = await resolveRedirect(slug);

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(target, 307);
}
