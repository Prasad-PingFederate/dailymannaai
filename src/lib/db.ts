// db.ts — Cosmos DB client singleton (replaces legacy Prisma setup)
// All persistence in DailyMannaAI is handled via Azure Cosmos DB.
export { getCosmosClient, getCosmosContainer } from "./cosmos";
