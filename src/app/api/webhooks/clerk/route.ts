import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import { db } from "@/lib/db";
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", { status: 400 });
  }

  // Handle user creation or update
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const data = JSON.parse(body).data;
    const user: Partial<User> = {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses[0].email_address,
      picture: data.image_url,
    };

    if (!user) return;

    const dbUser = await db.user.upsert({
      where: { email: user.email },
      update: user,
      create: {
        id: user.id!,
        name: user.name!,
        email: user.email!,
        picture: user.picture!,
        role: user.role || "USER", // Default role to "USER" if not provided
      },
    });

    // Update user's metadata in Clerk with the role information
    if (evt.type === "user.created") {
      const client = await clerkClient();
      await client.users.updateUserMetadata(data.id, {
        privateMetadata: {
          role: dbUser.role || "USER",
        },
      });
    }
  }

  // Handle user deletion
  if (evt.type === "user.deleted") {
    const userId = JSON.parse(body).data.id;
    await db.user.delete({
      where: { id: userId },
    });
  }

  return new Response("", { status: 200 });
}
