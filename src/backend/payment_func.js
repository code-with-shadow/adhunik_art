import conf from '../conf/conf.js';
import { Client, Functions } from "appwrite";

export class FunctionService {
    client = new Client();
    functions;

    constructor() {
        this.client
            .setEndpoint(conf.appwriteUrl)
            .setProject(conf.appwriteProjectId);
        
        this.functions = new Functions(this.client);
    }

    // Execute the PayPal Verification Function
    // Updated to accept 'items' (array) and 'totalPaid'
    async verifyPayment({ orderID, items, userId, totalPaid }) {
        try {
            const execution = await this.functions.createExecution(
                conf.appwritePaymentFunctionId,
                JSON.stringify({
                    orderID,
                    items, // Now sending array of IDs
                    userId,
                    totalPaid
                })
            );
            
            // Parse the response from the function
            return JSON.parse(execution.responseBody);
        } catch (error) {
            console.log("Appwrite service :: verifyPayment :: error", error);
            throw error;
        }
    }
}

const functionService = new FunctionService();
export default functionService;