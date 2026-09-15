import { NextResponse } from "next/server";
import { getCurrentAccount, toErrorResponse } from "@/lib/auth/account";
import { supabaseAdmin } from "@/lib/flows/admin-client";
import {
  buildContactAvatarPath,
  CONTACT_AVATAR_BUCKET,
  CONTACT_AVATAR_MAX_BYTES,
  CONTACT_AVATAR_MIME,
  contactAvatarExtension,
  contactAvatarPathFromUrl,
} from "@/lib/contacts/avatar";

let bucketReady: Promise<void> | null = null;

async function ensureBucket(): Promise<void> {
  const db = supabaseAdmin();
  const { data, error } = await db.storage.getBucket(CONTACT_AVATAR_BUCKET);
  if (data && !error) return;
  const created = await db.storage.createBucket(CONTACT_AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: CONTACT_AVATAR_MAX_BYTES,
    allowedMimeTypes: [...CONTACT_AVATAR_MIME],
  });
  if (
    created.error &&
    !/already exists|duplicate/i.test(created.error.message)
  ) {
    throw created.error;
  }
}

function readyBucket(): Promise<void> {
  bucketReady ??= ensureBucket().catch((err) => {
    bucketReady = null;
    throw err;
  });
  return bucketReady;
}

async function loadOwnedContact(accountId: string, contactId: string) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("contacts")
    .select("id, avatar_url")
    .eq("id", contactId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function removeStored(url: string | null | undefined): Promise<void> {
  const path = contactAvatarPathFromUrl(url);
  if (!path) return;
  await supabaseAdmin().storage.from(CONTACT_AVATAR_BUCKET).remove([path]);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getCurrentAccount();
    const { id: contactId } = await context.params;
    const contact = await loadOwnedContact(ctx.accountId, contactId);
    if (!contact) {
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Envie uma imagem" }, { status: 400 });
    }
    if (!CONTACT_AVATAR_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Use PNG, JPG, WebP ou GIF" },
        { status: 400 },
      );
    }
    if (file.size > CONTACT_AVATAR_MAX_BYTES) {
      return NextResponse.json({ error: "Máximo de 2 MB" }, { status: 400 });
    }
    const ext = contactAvatarExtension(file.type);
    if (!ext) {
      return NextResponse.json({ error: "Tipo de imagem inválido" }, { status: 400 });
    }

    await readyBucket();
    const path = buildContactAvatarPath(ctx.accountId, contactId, ext);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const db = supabaseAdmin();
    const { error: upErr } = await db.storage
      .from(CONTACT_AVATAR_BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: true,
        cacheControl: "3600",
      });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    const {
      data: { publicUrl },
    } = db.storage.from(CONTACT_AVATAR_BUCKET).getPublicUrl(path);

    const { error: updErr } = await db
      .from("contacts")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", contactId)
      .eq("account_id", ctx.accountId);
    if (updErr) {
      await db.storage.from(CONTACT_AVATAR_BUCKET).remove([path]);
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    if (contact.avatar_url && contact.avatar_url !== publicUrl) {
      await removeStored(contact.avatar_url);
    }

    return NextResponse.json({ avatar_url: publicUrl });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getCurrentAccount();
    const { id: contactId } = await context.params;
    const contact = await loadOwnedContact(ctx.accountId, contactId);
    if (!contact) {
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
    }

    const db = supabaseAdmin();
    const { error } = await db
      .from("contacts")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", contactId)
      .eq("account_id", ctx.accountId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await removeStored(contact.avatar_url);
    return NextResponse.json({ avatar_url: null });
  } catch (err) {
    return toErrorResponse(err);
  }
}
