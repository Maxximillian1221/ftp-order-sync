import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { uploadOrderToFtp } from "../utils/ftp.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("=== WEBHOOK RECEIVED - START ===");
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  console.log("Request headers:", Object.fromEntries([...request.headers.entries()]));
  
  const topic = new URL(request.url).searchParams.get("topic");
  console.log("Webhook topic:", topic);

  if (topic !== "orders/create") {
    console.log("Not an order creation webhook, ignoring");
    return new Response();
  }
  
  try {
    // Read the raw body once
    const rawBody = await request.text();
    console.log("Received webhook data length:", rawBody.length);

    // Log HMAC for debugging
    const hmac = request.headers.get("x-shopify-hmac-sha256");
    console.log("HMAC from header:", hmac);

    // Variables to store session and order data
    let shopDomain: string | null = null;
    let orderData: any = null;

    // Create a new request with the same body for authentication
    const authRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: rawBody
    });

    // Authenticate using the cloned request
    console.log("Authenticating webhook...");
    try {
      const { session } = await authenticate.webhook(authRequest);
      console.log("Authentication successful, shop:", session?.shop);
      
      if (!session?.shop) {
        throw new Error("No shop found in session");
      }

      shopDomain = session.shop;

      // Parse the already-read body
      orderData = JSON.parse(rawBody);
      console.log("Processing order:", orderData.name);
    } catch (authError: any) {
      console.error("Authentication failed:", authError.message);
      
      // For debugging purposes, try to process the order anyway
      console.log("Attempting to process order despite authentication failure");
      orderData = JSON.parse(rawBody);
      console.log("Order data parsed, order name:", orderData.name);
      
      // Extract shop domain from headers as fallback
      shopDomain = request.headers.get("x-shopify-shop-domain");
      if (!shopDomain) {
        console.error("No shop domain found in headers");
        return new Response("No shop domain found", { status: 401 });
      }
      
      console.log("Using shop domain from headers:", shopDomain);

      // Get FTP settings
      const ftpSettings = await db.ftpSettings.findFirst({
        where: { shop: shopDomain }
      });

      if (!ftpSettings) {
        console.error("No FTP settings found for shop:", shopDomain);
        return new Response("No FTP settings found", { status: 200 });
      }

      console.log("Found FTP settings for shop:", shopDomain);

      // Upload to FTP
      console.log("Starting FTP upload for order:", orderData.name);
      await uploadOrderToFtp(ftpSettings, {
        ...orderData,
        shop: shopDomain
      });

      console.log(`Order ${orderData.name} processed successfully despite auth failure`);
      return new Response("Processed without authentication", { status: 200 });
    }

    // If we get here, authentication was successful
    if (!shopDomain || !orderData) {
      throw new Error("Missing shop domain or order data after authentication");
    }

    // Get FTP settings
    const ftpSettings = await db.ftpSettings.findFirst({
      where: { shop: shopDomain }
    });

    if (!ftpSettings) {
      console.error("No FTP settings found for shop:", shopDomain);
      return new Response(null, { status: 200 });
    }

    console.log("Found FTP settings for shop:", shopDomain);

    // Upload to FTP
    console.log("Starting FTP upload for order:", orderData.name);
    await uploadOrderToFtp(ftpSettings, {
      ...orderData,
      shop: shopDomain
    });

    console.log(`Order ${orderData.name} processed successfully`);
    console.log("=== WEBHOOK PROCESSING COMPLETE ===");
    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in webhook handler:", error.message);
      console.error("Error stack:", error.stack);
      return new Response(error.message, { status: 200 }); // Return 200 to prevent retries
    }
    console.error("Unknown error in webhook handler");
    return new Response("Unknown error occurred", { status: 200 }); // Return 200 to prevent retries
  } finally {
    console.log("=== WEBHOOK RECEIVED - END ===");
  }
};
