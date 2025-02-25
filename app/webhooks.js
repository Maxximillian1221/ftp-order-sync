export const WEBHOOKS = {
  ORDER_CREATED: {
    callbackUrl: "/webhooks/order-created",
    callbackFormat: "json",
    deliveryMethod: "http",
    topic: "orders/create",
  },
};