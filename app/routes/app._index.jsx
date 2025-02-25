import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Button, BlockStack, Text, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    // First, get all current webhooks
    const webhooksResponse = await admin.graphql(
      `query {
        webhookSubscriptions(first: 10) {
          edges {
            node {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }`
    );

    const webhooksJson = await webhooksResponse.json();
    console.log("Current webhooks:", JSON.stringify(webhooksJson, null, 2));

    // Delete any existing order webhooks
    for (const { node } of webhooksJson.data.webhookSubscriptions.edges) {
      if (node.topic === "ORDERS_CREATE") {
        console.log("Deleting existing webhook:", node.id);
        await admin.graphql(
          `mutation webhookSubscriptionDelete($id: ID!) {
            webhookSubscriptionDelete(id: $id) {
              deletedWebhookSubscriptionId
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              id: node.id
            }
          }
        );
      }
    }

    // Register new webhook
    console.log("Registering new order webhook...");
    const response = await admin.graphql(
      `mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          topic: "ORDERS_CREATE",
          webhookSubscription: {
            callbackUrl: `${process.env.SHOPIFY_APP_URL}/webhooks?topic=orders/create`,
            format: "JSON"
          }
        }
      }
    );

    const responseJson = await response.json();
    console.log("Webhook registration response:", JSON.stringify(responseJson, null, 2));

    // Get FTP settings
    const ftpSettings = await db.ftpSettings.findFirst({
      where: { shop: session.shop }
    });

    // Check if webhook was registered successfully
    const hasOrderWebhook = responseJson.data?.webhookSubscriptionCreate?.webhookSubscription?.id != null;

    return json({
      hasOrderWebhook,
      hasFtpSettings: !!ftpSettings
    });
  } catch (error) {
    console.error("Error managing webhooks:", error);
    return json({ 
      hasOrderWebhook: false,
      hasFtpSettings: false,
      error: error.message 
    });
  }
};

export default function Index() {
  const { hasOrderWebhook, hasFtpSettings, error } = useLoaderData();

  return (
    <Page title="Order FTP Sync">
      <BlockStack gap="500">
        {error && (
          <Banner status="critical">
            <p>Error: {error}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Status
                </Text>

                <BlockStack gap="200">
                  <Text as="p">
                    FTP Settings: {hasFtpSettings ? '✅ Configured' : '❌ Not Configured'}
                  </Text>
                  <Text as="p">
                    Order Webhook: {hasOrderWebhook ? '✅ Active' : '❌ Not Active'}
                  </Text>
                </BlockStack>

                <Text as="p">
                  New orders will automatically be sent to your FTP server when created.
                </Text>

                <Button url="/app/ftp-settings">
                  Configure FTP Settings
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}