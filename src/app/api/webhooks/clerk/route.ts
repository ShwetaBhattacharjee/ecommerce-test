import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  // Fetch the Webhook Secret from the environment
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers from the request
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Validate headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", { status: 400 });
  }

  // Get the request payload
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Initialize the webhook verification
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
    return new Response("Error occurred", { status: 400 });
  }

  // Handle user creation and updates
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const data = JSON.parse(body).data;

    // Create a user object to update or insert into the database
    const user: Partial<User> = {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses[0].email_address,
      picture: data.image_url,
      role: data.private_metadata?.role || "USER", // Use role from metadata if present, default to "USER"
    };

    // If user data is invalid, exit the function
    if (!user) return;

    // Upsert user in the database (update if exists, create if not)
    const dbUser = await db.user.upsert({
      where: {
        email: user.email,
      },
      update: user,
      create: {
        id: user.id!,
        name: user.name!,
        email: user.email!,
        picture: user.picture!,
        role: user.role!, // Make sure the role is set
      },
    });

    // Update Clerk's metadata with the user's role from the database
    const client = await clerkClient();
    await client.users.updateUserMetadata(data.id, {
      privateMetadata: {
        role: dbUser.role || "USER", // Sync role from database to Clerk
      },
    });
  }

  // Handle user deletion
  if (evt.type === "user.deleted") {
    const userId = JSON.parse(body).data.id;

    // Delete the user from the database based on the user ID
    await db.user.delete({
      where: {
        id: userId,
      },
    });
  }

  return new Response("", { status: 200 });
}
