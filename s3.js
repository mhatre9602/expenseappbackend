const {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const moment = require("moment");

const IPFS_GATEWAY_BASE_URL = "https://ipfs.filebase.io/ipfs/";

let CID = null;

const S3_CONFIG = {
  AWS_BUCKET_NAME: process?.env?.FILEBASE_AWS_BUCKET_NAME,
  AWS_ACCESS_KEY: process?.env?.FILEBASE_AWS_ACCESS_KEY || "",
  AWS_SECRET_KEY: process?.env?.FILEBASE_AWS_SECRET_KEY || "",
  AWS_REGION: process?.env?.FILEBASE_AWS_REGION || "",
};
const client = new S3Client({
  credentials: {
    accessKeyId: S3_CONFIG.AWS_ACCESS_KEY,
    secretAccessKey: S3_CONFIG.AWS_SECRET_KEY,
  },
  region: S3_CONFIG.AWS_REGION,
  endpoint: process?.env?.FILEBASE_ENDPOINT,
});

const S3Service = {
  uploadFileToS3: async (data) => {
    const formatedDate = moment().toISOString();
    const fileName = `report-${formatedDate}.csv`;
    const pc = new PutObjectCommand({
      Bucket: S3_CONFIG.AWS_BUCKET_NAME,
      Key: `hf_stable_diffussion2/${fileName}`, //  `${YEAR}/${MONTH}/log-${formatedDate}.json`,
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
