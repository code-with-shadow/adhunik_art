const sdk = require("node-appwrite");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

module.exports = async function (context) {
  const client = new sdk.Client();
  const databases = new sdk.Databases(client);

  client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  // --- LOGGING HELPER ---
  const log = (msg) => context.log(`[PayPal Fn]: ${msg}`);
  const errorLog = (msg) => context.error(`[PayPal Fn Error]: ${msg}`);

  log("Function Started");

  const Environment = process.env.PAYPAL_ENVIRONMENT === "production"
      ? checkoutNodeJssdk.core.LiveEnvironment
      : checkoutNodeJssdk.core.SandboxEnvironment;

  const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(
    new Environment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  );

  // 1. PARSE PAYLOAD
  let payload = {};
  try {
    if (context.req.body) {
        payload = typeof context.req.body === 'string' ? JSON.parse(context.req.body) : context.req.body;
    } else if (context.payload) {
        payload = typeof context.payload === 'string' ? JSON.parse(context.payload) : context.payload;
    }
  } catch (e) {
      errorLog("JSON Parse Failed: " + e.message);
      return context.res.json({ success: false, message: "Invalid JSON" }, 400);
  }

  const { orderID, items, userId, shippingDetails, customerName, email, totalPaid, currency } = payload;
  
  log(`Processing OrderID: ${orderID} for User: ${userId}`);
  log(`Items to check: ${JSON.stringify(items)}`);

  if (!orderID || !userId) {
      return context.res.json({ success: false, message: "Missing Data" }, 400);
  }

  // Ensure items is an array
  const soldItems = Array.isArray(items) ? items : [];
  
  if (soldItems.length === 0) {
      errorLog("Items array is empty! Security check might be skipped.");
      return context.res.json({ success: false, message: "No items provided" }, 400);
  }

  try {
    // 2. 🛡️ SECURITY CHECK (The "Is Sold" Block)
    log("Starting DB Security Check...");
    
    for (const id of soldItems) {
        try {
            const painting = await databases.getDocument(
                process.env.APPWRITE_DATABASE_ID, 
                process.env.APPWRITE_PAINTINGS_COLLECTION_ID, 
                id
            );
            
            log(`Checking Item ${id} - Current isSold: ${painting.isSold}`);

            // Robust check for boolean true or string "true"
            if (painting.isSold === true || painting.isSold === "true") {
                errorLog(`❌ BLOCKED: Item ${painting.title} (${id}) is ALREADY SOLD.`);
                return context.res.json({ success: false, message: "Item already sold" }, 409); 
            }
        } catch (err) {
            errorLog(`Failed to fetch item ${id}: ${err.message}`);
            return context.res.json({ success: false, message: "Item not found in DB" }, 404);
        }
    }

    log("✅ Security Check Passed. Items are available.");

    // 3. CAPTURE PAYMENT
    log(`Capturing PayPal Order: ${orderID} with currency ${currency || 'USD'}`);
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await paypalClient.execute(request);
    
    if (capture.result.status !== "COMPLETED") {
        errorLog(`PayPal Capture Failed. Status: ${capture.result.status}`);
        return context.res.json({ success: false, message: "Payment Failed" }, 400);
    }

    log("💰 Payment Captured. Updating Database...");

    // 4. MARK AS SOLD
    for (const id of soldItems) {
      await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID, 
          process.env.APPWRITE_PAINTINGS_COLLECTION_ID, 
          id, 
          { isSold: true }
      );
      log(`Item ${id} marked as isSold: true`);
    }

    // 5. CREATE ORDER
    const orderDoc = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID, 
      process.env.APPWRITE_ORDERS_COLLECTION_ID, 
      sdk.ID.unique(),
      {
        userId, 
        customerName: customerName || "Guest", 
        email: email || "no-email",
        paintingId: soldItems.join(','), 
        amount: parseFloat(totalPaid),
        shippingAddress: typeof shippingDetails === 'object' ? JSON.stringify(shippingDetails) : String(shippingDetails),
        paymentId: capture.result.id, 
        status: 'Paid',
      }
    );

    log(`🎉 Order Created: ${orderDoc.$id}`);
    return context.res.json({ success: true, orderId: orderDoc.$id });

  } catch (error) {
    errorLog("CRITICAL ERROR: " + error.message);
    return context.res.json({ success: false, error: error.message }, 500);
  }
};