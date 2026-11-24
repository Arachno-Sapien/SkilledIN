import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SkilledInStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Single Table
    const table = new dynamodb.Table(this, "MainTable", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "SkilledIN-MainTable",
    });

    // 2. S3 Bucket for Challenge Videos
    const videoBucket = new s3.Bucket(this, "VideoBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: ["http://localhost:5173", "http://localhost:3000", "*"],
          allowedHeaders: ["*"],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          prefix: "videos/",
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // 3. Lambda Function API (Bundled with esbuild)
    const apiFunction = new lambdaNodejs.NodejsFunction(this, "ApiHandler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "../../backend/src/handler.ts"),
      handler: "handler",
      memorySize: 1024,
      timeout: cdk.Duration.seconds(120),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: videoBucket.bucketName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        ALLOWED_ORIGINS: "http://localhost:5173,http://localhost:3000,*",
        // AI model switch (backend/src/lib/ai.ts). Empty values fall back to the defaults there.
        AI_PROVIDER: process.env.AI_PROVIDER || "claude-bedrock",
        AI_MODEL_ID: process.env.AI_MODEL_ID || "anthropic.claude-opus-5-5",
        AI_REGION: process.env.AI_REGION || "",
        AI_EFFORT: process.env.AI_EFFORT || "",
        AI_BASE_URL: process.env.AI_BASE_URL || "",
        AI_API_KEY: process.env.AI_API_KEY || "",
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || "",
        ELEVENLABS_STT_MODEL: process.env.ELEVENLABS_STT_MODEL || "",
        ELEVENLABS_TTS_MODEL: process.env.ELEVENLABS_TTS_MODEL || "",
        ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || "",
      },
      bundling: {
        format: lambdaNodejs.OutputFormat.ESM,
        target: "node22",
        sourceMap: true,
        // Bundle everything: the Lambda runtime has no @anthropic-ai packages, and its
        // built-in AWS SDK may lack s3-presigned-post or lag behind the version we test with.
        externalModules: [],
        // CommonJS deps (express, AWS SDK) call require() for Node built-ins; ESM output needs this shim.
        banner: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
    });

    // 4. Function URL (No 29s timeout limitation)
    // No Function URL CORS: the Express app's cors middleware answers preflights, and two layers would send duplicate headers.
    const functionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // 5. IAM Permissions
    table.grantReadWriteData(apiFunction);
    videoBucket.grantReadWrite(apiFunction);

    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock-mantle:CreateInference", // Claude via AnthropicBedrockMantle
          "bedrock:InvokeModel", // Converse API (Amazon Nova and other Bedrock models)
          "geo-places:Geocode",
          "geo-places:SearchText",
        ],
        resources: ["*"],
      })
    );

    // 6. Outputs
    new cdk.CfnOutput(this, "FunctionUrl", {
      value: functionUrl.url,
      description: "Lambda Function URL for SkilledIN API",
    });

    new cdk.CfnOutput(this, "TableName", {
      value: table.tableName,
      description: "DynamoDB Main Table",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: videoBucket.bucketName,
      description: "S3 Challenge Videos Bucket",
    });
  }
}
