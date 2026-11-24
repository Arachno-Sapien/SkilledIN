import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
import { SkilledInStack } from "../lib/stack.js";

// The stack copies AI_* and ELEVENLABS_* from the repo-root .env into the Lambda's environment.
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const app = new cdk.App();
new SkilledInStack(app, "SkilledINStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || "ap-south-1",
  },
  description: "SkilledIN — Voice-first skill passport infrastructure for wHACKiest 2026",
});
