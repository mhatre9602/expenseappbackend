const {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const moment = require("moment");

const IPFS_GATEWAY_BASE_URL = "https://api.filebase.io/ipfs";

let CID = null;

const S3_CONFIG = {
  AWS_BUCKET_NAME: "pm-reports",
  AWS_ACCESS_KEY:
    process?.env?.FILEBASE_AWS_ACCESS_KEY || "2158853E0EAEFA545EE1",
  AWS_SECRET_KEY:
    process?.env?.FILEBASE_AWS_SECRET_KEY ||
    "Ifeo1jkSucF01kSyf7JJTlOibeAt2qe7cak8OTZF",
  AWS_REGION: "us-east-1",
};
const client = new S3Client({
  credentials: {
    accessKeyId: S3_CONFIG.AWS_ACCESS_KEY,
    secretAccessKey: S3_CONFIG.AWS_SECRET_KEY,
  },
  region: S3_CONFIG.AWS_REGION,
  endpoint: "https://s3.filebase.com",
});

const S3Service = {
  uploadFileToS3: async (data) => {
    const formatedDate = moment().toISOString();
    const fileName = `report-${formatedDate}.csv`;
    const pc = new PutObjectCommand({
      Bucket: S3_CONFIG.AWS_BUCKET_NAME,
      Key: `User_reports/${fileName}`, //  `${YEAR}/${MONTH}/log-${formatedDate}.json`,
      Body: data,
      // ContentType: "image/jpg",
    });
    const putObjectCommand = S3Service.addPutObjectMiddleware(pc);
    return {
      ...(await client.send(putObjectCommand)),
      reportUrl: IPFS_GATEWAY_BASE_URL + "" + CID,
    };
  },

  /**
   *
   * @param putObjectCommand
   *
   * This is used for FileBase middleware access.
   * Once file is uploaded we get `IPFS CID` from response headers which denotes unique ID
   * for accessing that file in FileBase.
   */
  addPutObjectMiddleware: (putObjectCommand) => {
    putObjectCommand.middlewareStack.add(
      (next) => async (args) => {
        // Check if request is incoming as middleware works both ways
        const response = await next(args);
        if (!response?.response?.statusCode) return response;

        // Get cid from headers
        const cid = response.response?.headers["x-amz-meta-cid"];
        CID = cid;
        return response;
      },
      {
        step: "build",
        name: "addCidToOutput",
      }
    );
    return putObjectCommand;
  },
};

module.exports = S3Service;
