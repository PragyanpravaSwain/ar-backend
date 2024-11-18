// config/awsConfig.js
import AWS from "aws-sdk";

const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: "2006-03-01", // Default API version for S3
};

// Initialize AWS S3 with the config
const s3 = new AWS.S3(s3Config);

export { s3, s3Config };
