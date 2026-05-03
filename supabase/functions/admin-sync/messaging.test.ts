import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const ADMIN_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Helper: insert a message and verify it exists in the DB.
 */
async function insertAndVerify(
  sender: string,
  receiver: string,
  content: string,
  extras: Record<string, unknown> = {},
) {
  const { data, error } = await db
    .from("messages")
    .insert({ sender_id: sender, receiver_id: receiver, content, ...extras })
    .select()
    .single();

  assertEquals(error, null, `Insert failed: ${error?.message}`);
  assertExists(data, "Inserted row should be returned");
  assertEquals(data.content, content);
  assertEquals(data.sender_id, sender);
  assertEquals(data.receiver_id, receiver);
  return data;
}

// ─── Test: Blogger → Admin text message ───
Deno.test("Blogger sends text to Admin", async () => {
  const fakeBlogger = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee01";
  const msg = await insertAndVerify(fakeBlogger, ADMIN_ID, "سلام ادمین - تست بلاگر");

  // Verify it can be read back
  const { data } = await db
    .from("messages")
    .select("*")
    .eq("id", msg.id)
    .single();
  assertExists(data);
  assertEquals(data!.content, "سلام ادمین - تست بلاگر");

  // Cleanup
  await db.from("messages").delete().eq("id", msg.id);
  const body = await (await fetch("about:blank").catch(() => null))?.text();
  void body;
});

// ─── Test: Admin → Blogger text message ───
Deno.test("Admin sends text to Blogger", async () => {
  const fakeBlogger = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee02";
  const msg = await insertAndVerify(ADMIN_ID, fakeBlogger, "پاسخ ادمین - تست");

  const { data } = await db
    .from("messages")
    .select("*")
    .eq("id", msg.id)
    .single();
  assertExists(data);
  assertEquals(data!.sender_id, ADMIN_ID);

  await db.from("messages").delete().eq("id", msg.id);
});

// ─── Test: Business → Admin text message ───
Deno.test("Business sends text to Admin", async () => {
  const fakeBiz = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee03";
  const msg = await insertAndVerify(fakeBiz, ADMIN_ID, "پیام کسب‌وکار");

  const { data } = await db
    .from("messages")
    .select("*")
    .eq("id", msg.id)
    .single();
  assertExists(data);

  await db.from("messages").delete().eq("id", msg.id);
});

// ─── Test: Admin → Business text message ───
Deno.test("Admin replies to Business", async () => {
  const fakeBiz = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee04";
  const msg = await insertAndVerify(ADMIN_ID, fakeBiz, "پاسخ ادمین به کسب‌وکار");

  assertEquals(msg.sender_id, ADMIN_ID);
  assertEquals(msg.receiver_id, fakeBiz);

  await db.from("messages").delete().eq("id", msg.id);
});

// ─── Test: Image attachment ───
Deno.test("Message with image attachment", async () => {
  const fakeBlogger = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee05";
  const msg = await insertAndVerify(fakeBlogger, ADMIN_ID, "📷 تصویر", {
    attachment_type: "image",
    attachment_url: "https://example.com/test.jpg",
  });

  assertEquals(msg.attachment_type, "image");
  assertEquals(msg.attachment_url, "https://example.com/test.jpg");

  await db.from("messages").delete().eq("id", msg.id);
});

// ─── Test: Bidirectional conversation flow ───
Deno.test("Full conversation: Blogger → Admin → Blogger", async () => {
  const fakeBlogger = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee06";

  // Step 1: Blogger sends
  const m1 = await insertAndVerify(fakeBlogger, ADMIN_ID, "سوال من");

  // Step 2: Admin replies
  const m2 = await insertAndVerify(ADMIN_ID, fakeBlogger, "پاسخ ادمین");

  // Step 3: Blogger follows up
  const m3 = await insertAndVerify(fakeBlogger, ADMIN_ID, "ممنون");

  // Verify order
  const { data: conv } = await db
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${fakeBlogger},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${fakeBlogger})`,
    )
    .order("created_at", { ascending: true });

  assertExists(conv);
  assertEquals(conv!.length, 3);
  assertEquals(conv![0].content, "سوال من");
  assertEquals(conv![1].content, "پاسخ ادمین");
  assertEquals(conv![2].content, "ممنون");

  // Cleanup
  for (const m of [m1, m2, m3]) {
    await db.from("messages").delete().eq("id", m.id);
  }
});

// ─── Test: Mark as read ───
Deno.test("Mark message as read", async () => {
  const fakeBlogger = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee07";
  const msg = await insertAndVerify(fakeBlogger, ADMIN_ID, "unread test");
  assertEquals(msg.is_read, false);

  await db.from("messages").update({ is_read: true }).eq("id", msg.id);

  const { data } = await db.from("messages").select("is_read").eq("id", msg.id).single();
  assertEquals(data!.is_read, true);

  await db.from("messages").delete().eq("id", msg.id);
});
