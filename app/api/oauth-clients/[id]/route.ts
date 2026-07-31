import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { log } from "@/lib/otel-logs";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const client = await prisma.oauthClient.findUnique({
      where: { clientId },
    });

    if (!client || client.userId !== session.user.id) {
      return new Response("Not found", { status: 404 });
    }

    await prisma.oauthClient.delete({
      where: { clientId },
    });

    log.info("OAuth istemcisi silindi", { clientId, userId: session.user.id });
    return new Response(null, { status: 204 });
  } catch (error) {
    log.error("OAuth istemcisi silinemedi", {
      clientId,
      reason: error instanceof Error ? error.message : String(error),
    });
    return new Response("Internal server error", { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Yetkisiz." }, { status: 401 });
  const client = await prisma.oauthClient.findUnique({ where: { clientId } });
  if (!client || client.userId !== session.user.id) return Response.json({ error: "Bulunamadı." }, { status: 404 });
  const { name, redirectUri } = await request.json() as { name?: string; redirectUri?: string };
  if (!name?.trim() || !redirectUri?.trim()) return Response.json({ error: "Ad ve callback URL gerekli." }, { status: 400 });
  try { new URL(redirectUri); } catch { return Response.json({ error: "Callback URL geçersiz." }, { status: 400 }); }
  await prisma.oauthClient.update({ where: { clientId }, data: { name: name.trim(), redirectUris: [redirectUri.trim()] } });
  return Response.json({ ok: true });
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return Response.json({ error: "Yetkisiz." }, { status: 401 });
  const client = await prisma.oauthClient.findUnique({ where: { clientId } });
  if (!client || client.userId !== session.user.id) return Response.json({ error: "Bulunamadı." }, { status: 404 });
  try {
    const updated = await auth.api.rotateClientSecret({ headers: requestHeaders, body: { client_id: clientId } });
    return Response.json({ client_secret: updated.client_secret });
  } catch (error) {
    log.error("Client secret yenilenemedi", {
      clientId,
      reason: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Secret yenilenemedi." }, { status: 400 });
  }
}
