import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { uploadOrderToFtp } from "../utils/ftp.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const topic = new URL(request.url).searchParams.get("topic");
  console.log("=== WEBHOOK RECEIVED ===", topic);

  if (topic !== "orders/create") {
    return new Response();
  }
  
  try {
    // Read the raw body once
    const rawBody = await request.text();
    console.log("Received webhook data");

    // Create a new request with the same body for authentication
    const authRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: rawBody
    });

    // Authenticate using the cloned request
    const { session } = await authenticate.webhook(authRequest);
    console.log("Authenticated webhook for shop:", session?.shop);
    
    if (!session?.shop) {
      throw new Error("No shop found in session");
    }

    // Parse the already-read body
    const orderData = JSON.parse(rawBody);
    console.log("Processing order:", orderData.name);

    // Get FTP settings
    const ftpSettings = await db.ftpSettings.findFirst({
      where: { shop: session.shop }
    });

    if (!ftpSettings) {
      console.error("No FTP settings found for shop:", session.shop);
      return new Response(null, { status: 200 });
    }

    console.log("Found FTP settings for shop:", session.shop);

    // Upload to FTP
    console.log("Starting FTP upload for order:", orderData.name);
    await uploadOrderToFtp(ftpSettings, {
      ...orderData,
      shop: session.shop
    });

    console.log(`Order ${orderData.name} processed successfully`);
    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in webhook handler:", error.message);
      return new Response(error.message, { status: 500 });
    }
    console.error("Unknown error in webhook handler");
    return new Response("Unknown error occurred", { status: 500 });
  }
};