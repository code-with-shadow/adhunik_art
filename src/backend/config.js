import conf from "../conf/conf.js"; 
import { Client, ID, Databases, Storage, Query } from "appwrite";

export class Service {
  client = new Client();
  databases;
  bucket;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);

    this.databases = new Databases(this.client);
    this.bucket = new Storage(this.client);
  }

  // --- 1. FETCHING DATA (This was missing!) ---
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
      if (!queries.some((q) => q.toString().includes("isSold"))) {
        queries.push(Query.equal("isSold", false));
      }
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

  // --- 2. CREATING & UPDATING DATA ---
  async createPainting({ title, price, category, description, imageUrl, isSold = false, medium, style, width, height, length, weight, shippingZone, discount = 0 }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwritePaintingsCollectionId,
        ID.unique(),
        {
          title, price, category, description, imageUrl, isSold,
          medium, style, width, height, length, weight, shippingZone,
          like: 0, discount: parseInt(discount) || 0
        }
      );
    } catch (error) {
      console.log("Appwrite service :: createPainting :: error", error);
      throw error;
    }
  }

  async updatePainting(slug, { title, price, category, description, imageUrl, isSold, medium, style, width, height, length, weight, shippingZone, discount, like }) {
    try {
        return await this.databases.updateDocument(
            conf.appwriteDatabaseId,
            conf.appwritePaintingsCollectionId,
            slug,
            { title, price, category, description, imageUrl, isSold, medium, style, width, height, length, weight, shippingZone, discount, like }
        );
    } catch (error) {
        console.log("Appwrite service :: updatePainting :: error", error);
        throw error;
    }
  }

  async updateLikeCount(slug, newCount) {
      try {
          return await this.databases.updateDocument(
              conf.appwriteDatabaseId,
              conf.appwritePaintingsCollectionId,
              slug,
              { like: newCount }
          );
      } catch (error) {
          console.warn("Appwrite service :: updateLikeCount :: warning (non-critical)", error.message);
          // This is non-critical - don't throw, just log
          return null;
      }
  }

  // --- 3. STORAGE & IMAGES ---
  async uploadFile(file) {
    try {
      if (!file) {
        throw new Error("No file provided for upload");
      }
      
      // Validate that file is actually a File object
      if (!(file instanceof File)) {
        throw new Error("Parameter 'file' has to be a File.");
      }
      
      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);
      
      const response = await this.bucket.createFile(
        conf.appwriteBucketId, 
        ID.unique(), 
        file
      );
      
      console.log("File uploaded successfully:", response.$id);
      return response;
    } catch (error) {
      console.error("Appwrite service :: uploadFile :: error", error);
      throw new Error(error.message || "Failed to upload file. Please check your internet connection and try again.");
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
      // Use getFileView for free tier
      const url = this.bucket.getFileView(conf.appwriteBucketId, fileId);
      return url.href || url.toString();
    } catch (error) {
      return null;
    }
  }
}

const service = new Service();
export default service;