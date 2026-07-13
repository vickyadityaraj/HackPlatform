"use server";

import { requireAuth } from "@/lib/guards";

export async function uploadFile(formData: FormData) {
  const user = await requireAuth();

  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "assets";

  if (!file) {
    throw new Error("No file provided");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "hackathon-assets";

  if (!supabaseUrl || !serviceKey || !anonKey) {
    throw new Error("Supabase environment variables are missing");
  }

  // Generate safe unique filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const uniqueName = `${Date.now()}-${randomSuffix}-${cleanName}`;
  const filePath = `${folder}/${uniqueName}`;

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;

  // Read file data as Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`[Storage Action] Uploading to: ${uploadUrl}`);

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "apikey": anonKey,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: buffer,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Storage Action] Supabase error:`, errorText);
    throw new Error(`Failed to upload file to storage: ${res.statusText}`);
  }

  // Generate public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
  console.log(`[Storage Action] Upload success. Public URL: ${publicUrl}`);

  return {
    url: publicUrl,
    path: filePath,
  };
}
