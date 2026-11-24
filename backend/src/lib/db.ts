import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

export interface DBItem {
  PK: string;
  SK: string;
  [key: string]: any;
}

const TABLE_NAME = process.env.TABLE_NAME || "SkilledIN-MainTable";
let docClient: DynamoDBDocumentClient | null = null;

// In-memory store fallback when AWS credentials or DynamoDB table are not provisioned in local dev
const memoryStore = new Map<string, DBItem>();

function isAwsConfigured(): boolean {
  return Boolean(
    process.env.TABLE_NAME &&
    (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE || process.env.AWS_SESSION_TOKEN)
  );
}

function getClient(): DynamoDBDocumentClient {
  if (!docClient) {
    const rawClient = new DynamoDBClient({
      region: process.env.AWS_REGION || "ap-south-1",
    });
    docClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClient;
}

export const db = {
  async get(pk: string, sk: string): Promise<DBItem | null> {
    if (!isAwsConfigured()) {
      return memoryStore.get(`${pk}##${sk}`) || null;
    }
    try {
      const res = await getClient().send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { PK: pk, SK: sk },
        })
      );
      return (res.Item as DBItem) || null;
    } catch (err) {
      console.warn("DynamoDB get fallback to memory:", (err as Error).message);
      return memoryStore.get(`${pk}##${sk}`) || null;
    }
  },

  async put(item: DBItem): Promise<void> {
    memoryStore.set(`${item.PK}##${item.SK}`, { ...item });
    if (!isAwsConfigured()) return;
    try {
      await getClient().send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );
    } catch (err) {
      console.warn("DynamoDB put failed, persisted in memory:", (err as Error).message);
    }
  },

  async queryPk(pk: string): Promise<DBItem[]> {
    if (!isAwsConfigured()) {
      const results: DBItem[] = [];
      for (const [key, value] of memoryStore.entries()) {
        if (key.startsWith(`${pk}##`)) {
          results.push(value);
        }
      }
      return results;
    }
    try {
      const res = await getClient().send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: { ":pk": pk },
        })
      );
      return (res.Items as DBItem[]) || [];
    } catch (err) {
      console.warn("DynamoDB query fallback to memory:", (err as Error).message);
      const results: DBItem[] = [];
      for (const [key, value] of memoryStore.entries()) {
        if (key.startsWith(`${pk}##`)) {
          results.push(value);
        }
      }
      return results;
    }
  },

  async scanWorkersByTrade(trade: string): Promise<DBItem[]> {
    if (!isAwsConfigured()) {
      const results: DBItem[] = [];
      for (const item of memoryStore.values()) {
        if (item.type === "worker" && item.trade === trade && item.SK === "PROFILE") {
          results.push(item);
        }
      }
      return results;
    }
    try {
      const res = await getClient().send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: "#type = :type AND #trade = :trade AND #sk = :sk",
          ExpressionAttributeNames: {
            "#type": "type",
            "#trade": "trade",
            "#sk": "SK",
          },
          ExpressionAttributeValues: {
            ":type": "worker",
            ":trade": trade,
            ":sk": "PROFILE",
          },
        })
      );
      return (res.Items as DBItem[]) || [];
    } catch (err) {
      console.warn("DynamoDB scan fallback to memory:", (err as Error).message);
      const results: DBItem[] = [];
      for (const item of memoryStore.values()) {
        if (item.type === "worker" && item.trade === trade && item.SK === "PROFILE") {
          results.push(item);
        }
      }
      return results;
    }
  },

  async transactWorkerAndPhone(workerProfile: DBItem, phoneLock: DBItem): Promise<boolean> {
    const existingPhone = memoryStore.get(`${phoneLock.PK}##${phoneLock.SK}`);
    if (existingPhone) {
      return false; // phone already taken
    }

    if (!isAwsConfigured()) {
      memoryStore.set(`${phoneLock.PK}##${phoneLock.SK}`, phoneLock);
      memoryStore.set(`${workerProfile.PK}##${workerProfile.SK}`, workerProfile);
      return true;
    }

    try {
      await getClient().send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: TABLE_NAME,
                Item: phoneLock,
                ConditionExpression: "attribute_not_exists(PK)",
              },
            },
            {
              Put: {
                TableName: TABLE_NAME,
                Item: workerProfile,
              },
            },
          ],
        })
      );
      memoryStore.set(`${phoneLock.PK}##${phoneLock.SK}`, phoneLock);
      memoryStore.set(`${workerProfile.PK}##${workerProfile.SK}`, workerProfile);
      return true;
    } catch (err: any) {
      if (err.name === "TransactionCanceledException" || err.message?.includes("ConditionalCheckFailed")) {
        return false;
      }
      console.warn("TransactWrite failed, using memory store:", err.message);
      memoryStore.set(`${phoneLock.PK}##${phoneLock.SK}`, phoneLock);
      memoryStore.set(`${workerProfile.PK}##${workerProfile.SK}`, workerProfile);
      return true;
    }
  },

  async updateJobAcceptance(
    jobId: string,
    workerId: string
  ): Promise<{ success: boolean; job: DBItem | null }> {
    const jobKey = `JOB#${jobId}##META`;
    const offerKey = `WORKER#${workerId}##OFFER#${jobId}`;

    const offer = memoryStore.get(offerKey);
    const job = memoryStore.get(jobKey);

    if (offer) {
      offer.status = "accepted";
    }
    if (job) {
      if (!Array.isArray(job.acceptedWorkerIds)) {
        job.acceptedWorkerIds = [];
      }
      if (!job.acceptedWorkerIds.includes(workerId)) {
        job.acceptedWorkerIds.push(workerId);
      }
    }

    if (isAwsConfigured()) {
      try {
        await getClient().send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `WORKER#${workerId}`, SK: `OFFER#${jobId}` },
            UpdateExpression: "SET #status = :accepted",
            ExpressionAttributeNames: { "#status": "status" },
            ExpressionAttributeValues: { ":accepted": "accepted" },
          })
        );
        await getClient().send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `JOB#${jobId}`, SK: "META" },
            UpdateExpression: "ADD acceptedWorkerIds :w",
            ExpressionAttributeValues: { ":w": new Set([workerId]) },
          })
        );
      } catch (e) {
        console.warn("DynamoDB update acceptance:", (e as Error).message);
      }
    }

    return { success: true, job: job || null };
  },
};
