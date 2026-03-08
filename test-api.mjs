import "dotenv/config";
import { DataAPIClient } from "@datastax/astra-db-ts";

async function run() {
    console.log("Starting...");
    const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    const db = client.db(process.env.ASTRA_DB_API_ENDPOINT, {
        keyspace: process.env.ASTRA_DB_NAMESPACE || "default_keyspace"
    });
    const col = db.collection("users");

    console.log("Finding user...");
    const email = "prasad.dammai94@gmail.com";
    let user = await col.findOne({ email });
    console.log("Before Update:", user);

    if (user) {
        console.log("Updating OTP...");
        const result = await col.updateOne(
            { email },
            { $set: { otp_code: "123456", otp_expires: new Date().toISOString() } }
        );
        console.log("Update Result:", result);

        user = await col.findOne({ email });
        console.log("After Update:", user);

        console.log("Clearing OTP...");
        const clearResult = await col.updateOne(
            { email },
            { $unset: { otp_code: "", otp_expires: "" } }
        );
        console.log("Clear Result:", clearResult);
    }
}
run().catch(console.error);
