import * as cdk from "aws-cdk-lib";
import { SkilledInStack } from "../lib/stack.js";

const app = new cdk.App();
new SkilledInStack(app, "SkilledINStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || "ap-south-1",
  },
  description: "SkilledIN — Voice-first skill passport infrastructure for wHACKiest 2026",
});
