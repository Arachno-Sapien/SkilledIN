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
  // Single-table items carry different attributes per entity type.
  [key: string]: any;
}

export type StoreMode = "dynamodb" | "memory";

let mode: StoreMode | null = null;
let docClient: DynamoDBDocumentClient | null = null;

// Local-dev store only. It is never a fallback for DynamoDB: a silent fallback told workers their
// passport was saved while nothing reached the table, and Lambda memory is gone on the next cold start.
// It also empties on every `tsx watch` restart.
const memoryStore = new Map<string, DBItem>();
const memKey = (pk: string, sk: string) => `${pk}##${sk}`;
const table = () => process.env.TABLE_NAME as string;

/**
 * DynamoDB whenever TABLE_NAME is set. Credentials come from the SDK default chain, so a missing
 * credential is a loud error instead of a quiet switch to memory. Decided on first use (after
 * local.ts has loaded .env) and logged once so the active store is visible in logs and /api/health.
 */
export function storeMode(): StoreMode {
  if (!mode) {
    mode = process.env.TABLE_NAME ? "dynamodb" : "memory";
    console.log(JSON.stringify({ level: "info", msg: "db mode", store: mode }));
  }
  return mode;
}

function client(): DynamoDBDocumentClient {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" }),
      { marshallOptions: { removeUndefinedValues: true } }
    );
  }
  return docClient;
}

function memoryByPk(pk: string): DBItem[] {
  return [...memoryStore.entries()].filter(([k]) => k.startsWith(`${pk}##`)).map(([, v]) => v);
}

// Every DynamoDB error propagates to the route (ah() -> 500 INTERNAL) so the client never hears "saved" for a failed write.
export const db = {
  async get(pk: string, sk: string): Promise<DBItem | null> {
    if (storeMode() === "memory") return memoryStore.get(memKey(pk, sk)) ?? null;
    const res = await client().send(new GetCommand({ TableName: table(), Key: { PK: pk, SK: sk } }));
    return (res.Item as DBItem) ?? null;
  },

  async put(item: DBItem): Promise<void> {
    if (storeMode() === "memory") {
      memoryStore.set(memKey(item.PK, item.SK), { ...item });
      return;
    }
    await client().send(new PutCommand({ TableName: table(), Item: item }));
  },

  async queryPk(pk: string): Promise<DBItem[]> {
    if (storeMode() === "memory") return memoryByPk(pk);
    // ponytail: one Query page (1 MB) per worker — paginate with ExclusiveStartKey if a worker ever has thousands of items.
    const res = await client().send(
      new QueryCommand({
        TableName: table(),
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
      })
    );
    return (res.Items as DBItem[]) ?? [];
  },

  async scanWorkersByTrade(trade: string): Promise<DBItem[]> {
    if (storeMode() === "memory") {
      return [...memoryStore.values()].filter((i) => i.type === "worker" && i.trade === trade && i.SK === "PROFILE");
    }
    // ponytail: full-table Scan for hiring matches — fine at demo scale; add a trade GSI when the table grows.
    // Paged because each Scan page reads 1 MB before filtering, so one page would silently drop workers.
    const results: DBItem[] = [];
    let startKey: Record<string, unknown> | undefined;
    do {
      const res = await client().send(
        new ScanCommand({
          TableName: table(),
          FilterExpression: "#type = :type AND #trade = :trade AND #sk = :sk",
          ExpressionAttributeNames: { "#type": "type", "#trade": "trade", "#sk": "SK" },
          ExpressionAttributeValues: { ":type": "worker", ":trade": trade, ":sk": "PROFILE" },
          ExclusiveStartKey: startKey,
        })
      );
      results.push(...((res.Items as DBItem[]) ?? []));
      startKey = res.LastEvaluatedKey;
    } while (startKey);
    return results;
  },

  /** false = the phone is already registered; throws on any storage failure. */
  async transactWorkerAndPhone(workerProfile: DBItem, phoneLock: DBItem): Promise<boolean> {
    if (storeMode() === "memory") {
      if (memoryStore.has(memKey(phoneLock.PK, phoneLock.SK))) return false;
      memoryStore.set(memKey(phoneLock.PK, phoneLock.SK), { ...phoneLock });
      memoryStore.set(memKey(workerProfile.PK, workerProfile.SK), { ...workerProfile });
      return true;
    }

    try {
      await client().send(
        new TransactWriteCommand({
          TransactItems: [
            { Put: { TableName: table(), Item: phoneLock, ConditionExpression: "attribute_not_exists(PK)" } },
            { Put: { TableName: table(), Item: workerProfile } },
          ],
        })
      );
      return true;
    } catch (err) {
      // Only the phone-lock condition means "already registered"; throttling or a conflict is a real failure.
      const e = err as { name?: string; message?: string; CancellationReasons?: { Code?: string }[] };
      const lockTaken =
        e.name === "TransactionCanceledException" &&
        (e.CancellationReasons?.some((r) => r.Code === "ConditionalCheckFailed") || /ConditionalCheckFailed/.test(e.message ?? ""));
      if (lockTaken) return false;
      throw err;
    }
  },

  async updateJobAcceptance(
    jobId: string,
    workerId: string
  ): Promise<{ success: boolean; job: DBItem | null }> {
    if (storeMode() === "memory") {
      const offer = memoryStore.get(memKey(`WORKER#${workerId}`, `OFFER#${jobId}`));
      const job = memoryStore.get(memKey(`JOB#${jobId}`, "META")) ?? null;
      if (offer) offer.status = "accepted";
      if (job) {
        if (!Array.isArray(job.acceptedWorkerIds)) job.acceptedWorkerIds = [];
        if (!job.acceptedWorkerIds.includes(workerId)) job.acceptedWorkerIds.push(workerId);
      }
      return { success: true, job };
    }

    await client().send(
      new UpdateCommand({
        TableName: table(),
        Key: { PK: `WORKER#${workerId}`, SK: `OFFER#${jobId}` },
        UpdateExpression: "SET #status = :accepted",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":accepted": "accepted" },
      })
    );
    try {
      // POST /api/jobs writes acceptedWorkerIds as a list, so append to the list: ADD with a string set fails on a list.
      const res = await client().send(
        new UpdateCommand({
          TableName: table(),
          Key: { PK: `JOB#${jobId}`, SK: "META" },
          UpdateExpression: "SET acceptedWorkerIds = list_append(if_not_exists(acceptedWorkerIds, :empty), :w)",
          ConditionExpression: "attribute_exists(PK) AND NOT contains(acceptedWorkerIds, :id)",
          ExpressionAttributeValues: { ":empty": [], ":w": [workerId], ":id": workerId },
          ReturnValues: "ALL_NEW",
        })
      );
      return { success: true, job: (res.Attributes as DBItem) ?? null };
    } catch (err) {
      // Already accepted (a retry) or no such job: nothing to append, return the job as stored.
      if ((err as { name?: string }).name !== "ConditionalCheckFailedException") throw err;
      return { success: true, job: await db.get(`JOB#${jobId}`, "META") };
    }
  },
};
