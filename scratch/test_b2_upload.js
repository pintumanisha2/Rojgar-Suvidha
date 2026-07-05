const dotenv = require('dotenv');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const keyId = process.env.B2_KEY_ID;
const appKey = process.env.B2_APPLICATION_KEY;
const endpoint = process.env.B2_ENDPOINT;
const bucketName = process.env.B2_BUCKET_NAME;

async function test() {
  console.log("Testing local B2 S3 credentials...");
  console.log("B2_KEY_ID:", keyId);
  console.log("B2_APPLICATION_KEY length:", appKey ? appKey.length : 0);
  console.log("B2_ENDPOINT:", endpoint);
  console.log("B2_BUCKET_NAME:", bucketName);

  if (!keyId || !appKey || !endpoint || !bucketName) {
    console.error("Missing B2 environment variables!");
    return;
  }

  const s3Client = new S3Client({
    endpoint: `https://${endpoint}`,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
    },
    region: "us-east-1",
    forcePathStyle: true,
  });

  const testKey = `test_upload_${Date.now()}.txt`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: "Hello from local test script!",
      ContentType: "text/plain",
    });

    const response = await s3Client.send(command);
    console.log("Success!", response);
  } catch (err) {
    console.error("B2 Upload Error:", err);
  }
}

test();
