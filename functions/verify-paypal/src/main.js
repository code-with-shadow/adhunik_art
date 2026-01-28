const sdk = require("node-appwrite");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

module.exports = async function (context) {
  // 1. SETUP APPWRITE CLIENT
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);

  // These verify your identity as the "Admin" (Server)
  client
    .setEndpoint("https://cloud.appwrite.io/v1") // Check your endpoint
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  // 2. SETUP PAYPAL CLIENT
  const Environment =
    process.env.PAYPAL_ENVIRONMENT === "production"
      ? checkoutNodeJssdk.core.LiveEnvironment
      : checkoutNodeJssdk.core.SandboxEnvironment;
      
  const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(
    new Environment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  );

  // 3. HANDLE THE REQUEST
  if (context.req.method === "POST") {
    try {
      // Parse data sent from React
      const payload = JSON.parse(context.req.body);
      const { orderID, paintingId, userId } = payload;

      if (!orderID || !paintingId) {
        return context.res.json({ success: false, message: "Missing Data" }, 400);
      }

      // Step A: Verify Payment with PayPal
      const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
      const capture = await paypalClient.execute(request);

      // Step B: Check if PayPal says "COMPLETED"
      if (capture.result.status === "COMPLETED") {
        
        // Step C: Mark Painting as SOLD in Database
        // Replace 'YOUR_DATABASE_ID' etc. with your actual IDs or Env Variables
        await databases.updateDocument(
          process.env.DATABASE_ID, 
          process.env.PAINTINGS_COLLECTION_ID,
          paintingId,
          { isSold: true }
        );

        // Step D: Create a Receipt (Order) in Database
        const newOrder = await databases.createDocument(
          process.env.DATABASE_ID,
          process.env.ORDERS_COLLECTION_ID,
          sdk.ID.unique(),
          {
            userId: userId,
            paintingId: paintingId,
            amount: parseFloat(capture.result.purchase_units[0].amount.value),
            paymentId: capture.result.id,
            customerEmail: capture.result.payer.email_address,
            date: new Date().toISOString()
          }
        );

        return context.res.json({ success: true, orderId: newOrder.$id });
      } else {
        return context.res.json({ success: false, message: "Payment status not completed" }, 400);
      }
    } catch (error) {
      context.error(error.toString());
      return context.res.json({ success: false, error: error.message }, 500);
    }
  }

  return context.res.json({ message: "Only POST allowed" }, 405);
};