import conf from "../conf/conf.js"; 
import { Client, ID, Databases, Storage, Query, Functions } from "appwrite";

export class Service {
  client = new Client();
  databases;
  bucket;
  functions; 

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);

    this.databases = new Databases(this.client);
    this.bucket = new Storage(this.client);
    this.functions = new Functions(this.client);
  }

  // ==========================================
  //  🎨 PAINTINGS (PRODUCTS)
  // ==========================================

  async getPainting(slug) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwritePaintingsCollectionId,
        slug
      );
    } catch (error) {
      console.log("Appwrite service :: getPainting :: error", error);
      return false;
    }
  }

  async getPaintings(queries = []) {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwritePaintingsCollectionId,
        queries
      );
    } catch (error) {
      console.error("Appwrite service :: getPaintings :: error", error);
      return { documents: [], total: 0 };
    }
  }

  // 👇 RESTORED: This was missing
  async createPainting({ 
    title, category, description, imageUrl, isSold = false, 
    medium, style, width, height, length, weight, shippingZone, 
    pricein, priceusd, discountin, discountusd 
  }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwritePaintingsCollectionId,
        ID.unique(),
        {
          title, category, description, imageUrl, isSold,
          medium, style, width, height, length, weight, shippingZone,
          like: 0,
          pricein: parseFloat(pricein) || 0,
          priceusd: parseFloat(priceusd) || 0,
          discountin: parseFloat(discountin) || 0,
          discountusd: parseFloat(discountusd) || 0
        }
      );
    } catch (error) {
      console.log("Appwrite service :: createPainting :: error", error);
      throw error;
    }
  }

  // 👇 RESTORED: This was missing
  async updatePainting(slug, { 
    title, category, description, imageUrl, isSold, 
    medium, style, width, height, length, weight, shippingZone, 
    pricein, priceusd, discountin, discountusd, like 
  }) {
    try {
        return await this.databases.updateDocument(
          conf.appwriteDatabaseId,
          conf.appwritePaintingsCollectionId,
          slug,
          { 
            title, category, description, imageUrl, isSold, 
            medium, style, width, height, length, weight, shippingZone, 
            pricein, priceusd, discountin, discountusd, like 
          }
        );
    } catch (error) {
        console.log("Appwrite service :: updatePainting :: error", error);
        throw error;
    }
  }

  // 👇 RESTORED: This was missing
  async updateLikeCount(slug, newCount) {
      try {
          return await this.databases.updateDocument(
              conf.appwriteDatabaseId,
              conf.appwritePaintingsCollectionId,
              slug,
              { like: newCount }
          );
      } catch (error) {
          console.warn("Appwrite service :: updateLikeCount :: warning", error.message);
          return null;
      }
  }

  // ==========================================
  //  📦 ORDERS & PAYMENTS (SECURE FLOW)
  // ==========================================

  async verifyPayment(payload) {
    try {
        const execution = await this.functions.createExecution(
            conf.appwritePaymentFunctionId,
            JSON.stringify(payload),
            false,
            '/',
            'POST',
            {'Content-Type': 'application/json'}
        );
        const response = JSON.parse(execution.responseBody);
        return response; 
    } catch (error) {
        console.error("Appwrite service :: verifyPayment :: error", error);
        throw error;
    }
  }

  // 👇 NEW: Handle Cash on Delivery (COD) - India Only
  async createCODOrder({ userId, items, customerName, email, shippingDetails }) {
      try {
          const paintingIds = Array.isArray(items) ? items : [items];
          
          // 1. Verify unsold first
          for (const id of paintingIds) {
              const p = await this.databases.getDocument(conf.appwriteDatabaseId, conf.appwritePaintingsCollectionId, id);
              if (p.isSold) throw new Error(`Item ${p.title} is already sold.`);
          }

          // 2. Mark Sold
          for (const id of paintingIds) {
              await this.databases.updateDocument(
                  conf.appwriteDatabaseId, 
                  conf.appwritePaintingsCollectionId, 
                  id, 
                  { isSold: true }
              );
          }

          // 3. Create Order Record
          const shippingString = typeof shippingDetails === 'object' ? JSON.stringify(shippingDetails) : String(shippingDetails);

          return await this.databases.createDocument(
              conf.appwriteDatabaseId,
              conf.appwriteOrdersCollectionId,
              ID.unique(),
              {
                  userId,
                  paintingId: paintingIds.join(','),
                  amount: 0.0, 
                  paymentId: userId, 
                  status: 'Paid', // Using 'Paid' to ensure it passes Enum validation
                  customerName,
                  email,
                  shippingAddress: shippingString
              }
          );

      } catch (error) {
          console.error("Appwrite service :: createCODOrder :: error", error);
          throw error;
      }
  }

  // Admin manual create order
  async createOrder({ userId, items, totalAmount, paymentMethod, paymentId, status, customerName, email, shippingDetails }) {
    try {
        const shippingString = typeof shippingDetails === 'object' ? JSON.stringify(shippingDetails) : shippingDetails;

        return await this.databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteOrdersCollectionId,
            ID.unique(),
            {
                userId,
                paintingId: Array.isArray(items) ? items.join(',') : items, 
                amount: parseFloat(totalAmount),
                paymentId,
                status: status || 'Paid',
                customerName,
                email,
                shippingAddress: shippingString
            }
        );
    } catch (error) {
        console.error("Appwrite service :: createOrder :: error", error);
        throw error;
    }
  }

  async getOrders(queries = []) {
    try {
        if (!queries.some(q => q.toString().includes("orderDesc"))) {
             queries.push(Query.orderDesc('$createdAt'));
        }
        return await this.databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteOrdersCollectionId,
            queries
        );
    } catch (error) {
        console.error("Appwrite service :: getOrders :: error", error);
        return { documents: [], total: 0 };
    }
  }

  // ==========================================
  //  🖼️ STORAGE & IMAGES
  // ==========================================

  async uploadFile(file) {
    try {
      if (!file) throw new Error("No file provided");
      const response = await this.bucket.createFile(
        conf.appwriteBucketId, 
        ID.unique(), 
        file
      );
      return response;
    } catch (error) {
      console.error("Appwrite service :: uploadFile :: error", error);
      throw new Error(error.message || "Failed to upload file.");
    }
  }

  getThumbnail(fileIdInput) {
    try {
      let fileId = fileIdInput;
      if (!fileId) return null;
      if (typeof fileId === 'string' && fileId.includes('/files/')) {
          const parts = fileId.split('/files/');
          if (parts[1]) fileId = parts[1].split('/')[0];
      }
      const url = this.bucket.getFileView(conf.appwriteBucketId, fileId);
      return url.href || url.toString();
    } catch (error) {
      return null;
    }
  }
  
  getFileView(fileIdInput) {
      return this.getThumbnail(fileIdInput); 
  }
}

const service = new Service();
export default service;