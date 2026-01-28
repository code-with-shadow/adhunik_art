import conf from '../conf/conf.js';
import { Client, Account, ID, Databases } from "appwrite";

export class AuthService {
    client = new Client();
    account;
    databases;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);
        this.account = new Account(this.client);
        this.databases = new Databases(this.client);
    }

    async createAccount({ email, password, name, country }) {
        try {
            // 1. Create User in Appwrite Auth
            const userAccount = await this.account.create(ID.unique(), email, password, name);

            if (userAccount) {
                // ⚡ FIX: Login FIRST to establish a session
                // This gives the user permission to write to the database
                await this.login({ email, password });

                // 2. NOW Create the Document (as a logged-in user)
                try {
                    await this.databases.createDocument(
                        conf.appwriteDatabaseId,
                        conf.appwriteUserCollectionId,
                        userAccount.$id, // Link Auth ID to Database ID
                        {
                            name: name,
                            email: email,
                            country: country,
                            isAdmin: false
                        }
                    );
                } catch (dbError) {
                    console.warn("Could not save user profile to database (collection might not exist):", dbError.message);
                    // Don't throw - the auth user was created successfully
                }

                return userAccount;
            } else {
                return userAccount;
            }
        } catch (error) {
            console.log("Appwrite service :: createAccount :: error", error);
            throw error;
        }
    }

    async login({ email, password }) {
        try {
            return await this.account.createEmailPasswordSession(email, password);
        } catch (error) {
            console.log("Appwrite service :: login :: error", error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const authUser = await this.account.get();
            
            // Try to fetch extra details from Database
            try {
                const dbUser = await this.databases.getDocument(
                    conf.appwriteDatabaseId,
                    conf.appwriteUserCollectionId,
                    authUser.$id
                );
                return { ...authUser, ...dbUser }; 
            } catch (dbError) {
                return authUser;
            }
        } catch (error) {
            // console.log("Appwrite service :: getCurrentUser :: error", error);
        }
        return null;
    }

    async logout() {
        try {
            await this.account.deleteSessions();
        } catch (error) {
            console.log("Appwrite service :: logout :: error", error);
        }
    }

    async updateUserAddress(userId, addressString) {
        try {
            return await this.databases.updateDocument(
                conf.appwriteDatabaseId,
                conf.appwriteUserCollectionId,
                userId,
                { address: addressString }
            );
        } catch (error) {
            console.warn("Could not update user address:", error.message);
            // Non-critical error - don't throw
            return null;
        }
    }
}

const authService = new AuthService();
export default authService;