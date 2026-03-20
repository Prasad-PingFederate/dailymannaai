import { CosmosClient } from "@azure/cosmos";

let cosmosClient: CosmosClient | null = null;

export function getCosmosClient() {
    if (!cosmosClient) {
        const connectionString = process.env.COSMOS_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error("COSMOS_CONNECTION_STRING is not defined");
        }
        cosmosClient = new CosmosClient(connectionString);
    }
    return cosmosClient;
}

export function getCosmosContainer(databaseName: string, containerName: string) {
    const client = getCosmosClient();
    return client.database(databaseName).container(containerName);
}
