import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // When user is created or updated
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const data = JSON.parse(body).data;

    // Extract relevant properties from Clerk event data
    const user: Partial<User> = {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      email: data.email_addresses[0].email_address,
      picture: data.image_url,
      role: data.private_metadata?.role || "USER", // Default to "USER" if role is missing
    };

    if (!user) return;

    // Upsert user in the database (update if exists, create if not)
    const dbUser = await db.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        ...user,
      },
      create: {
        ...user,
      },
    });

    // Update user's metadata in Clerk with the role information
    await clerkClient.users.updateUserMetadata(data.id, {
      privateMetadata: {
        role: dbUser.role, // Use the database role to update Clerk metadata
      },
    });
  }

  // When user is deleted
  if (evt.type === "user.deleted") {
    const userId = JSON.parse(body).data.id;

    try {
      await db.user.delete({
        where: {
          id: userId,
        },
      });
      console.log(`User with ID ${userId} deleted from the database.`);
    } catch (error) {
      console.error(`Failed to delete user with ID ${userId}:`, error);
    }
  }

  return new Response("", { status: 200 });
}
