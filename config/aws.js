import { S3Client } from "@aws-sdk/client-s3";

// Initialize the S3 Client with your AWS credentials and region
const s3Client = new S3Client({
  region: process.env.AWS_REGION, // your region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // make sure these env variables are set
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default s3Client;