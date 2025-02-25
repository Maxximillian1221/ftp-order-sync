import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  FormLayout,
  TextField,
  Button,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Form,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { testFtpConnection } from "../utils/ftp.server";
import { useState } from "react";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  
  const settings = await db.ftpSettings.findFirst({
    where: { shop: session.shop }
  });
  
  return json({ settings });
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  const ftpData = {
    host: formData.get("host"),
    port: parseInt(formData.get("port")),
    username: formData.get("username"),
    password: formData.get("password"),
  };

  if (action === "test") {
    try {
      await testFtpConnection(ftpData);
      return json({ success: true, message: "Connection successful!" });
    } catch (error) {
      return json({ success: false, message: error.message });
    }
  }

  if (action === "save") {
    try {
      await db.ftpSettings.upsert({
        where: { shop: session.shop },
        update: ftpData,
        create: {
          shop: session.shop,
          ...ftpData
        }
      });
      return json({ success: true, message: "Settings saved successfully!" });
    } catch (error) {
      return json({ success: false, message: error.message });
    }
  }
}

export default function FtpSettings() {
  const { settings } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigation();
  const submit = useSubmit();
  const [formState, setFormState] = useState({
    host: settings?.host || "",
    port: settings?.port || "21",
    username: settings?.username || "",
    password: settings?.password || "",
  });

  const isLoading = navigate.state === "submitting";

  const handleChange = (value, name) => {
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("action", "save");
    submit(formData, { method: "POST" });
  };

  const handleTest = () => {
    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("action", "test");
    submit(formData, { method: "POST" });
  };

  return (
    <Page title="FTP Settings">
      <BlockStack gap="500">
        {actionData?.message && (
          <Banner
            title={actionData.success ? "Success" : "Error"}
            status={actionData.success ? "success" : "critical"}
          >
            <p>{actionData.message}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Form onSubmit={handleSubmit}>
                  <FormLayout>
                    <TextField
                      label="FTP Host"
                      value={formState.host}
                      onChange={(value) => handleChange(value, "host")}
                      autoComplete="off"
                      helpText="The FTP server address"
                    />
                    <TextField
                      label="Port"
                      type="number"
                      value={formState.port}
                      onChange={(value) => handleChange(value, "port")}
                      helpText="Default FTP port is 21"
                    />
                    <TextField
                      label="Username"
                      value={formState.username}
                      onChange={(value) => handleChange(value, "username")}
                      autoComplete="off"
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={formState.password}
                      onChange={(value) => handleChange(value, "password")}
                      autoComplete="off"
                    />
                    
                    <InlineStack gap="300" align="end">
                      <Button onClick={handleTest} loading={isLoading}>
                        Test Connection
                      </Button>
                      <Button primary submit loading={isLoading}>
                        Save Settings
                      </Button>
                    </InlineStack>
                  </FormLayout>
                </Form>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}