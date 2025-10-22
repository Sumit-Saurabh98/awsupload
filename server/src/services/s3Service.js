
import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv"
dotenv.config()


const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const PREFIX = process.env.S3_UPLOAD_PREFIX || ""

const s3 = new S3Client({region:REGION});

// create pre-signed put for single upload
export async function createPreSignedPutUrl(key, expires=900){
    const cmd = new PutObjectCommand({Bucket:BUCKET, Key:key});
    const url = await getSignedUrl(s3, cmd, {expiresIn:expires})

    return url;
}

// start multi-part upload, return uploadId
export async function startMultipartUpload(key, contentType){
    const cmd = new CreateMultipartUploadCommand({
        Bucket:BUCKET,
        Key:key,
        ContentType:contentType
    })

    const res = await s3.send(cmd);
    return res.UploadId;
}

// get pre-signed url for uploaded part
export async function getPartPreSignedUrl(key, uploadId, partNumber, expires=3600){
    const cmd = new UploadPartCommand({
        Bucket:BUCKET,
        Key:key,
        UploadId:uploadId,
        PartNumber:partNumber
    })

    return await getSignedUrl(s3, cmd, {expiresIn:expires})
}


// complete multipart

export async function completeMultiPartUpload(key, uploadId, parts){
    const cmd = new CompleteMultipartUploadCommand({
        Bucket:BUCKET,
        Key:key,
        UploadId:uploadId,
        MultipartUpload:{
            Parts:parts
        }
    })

    return await s3.send(cmd);
}

// abort multipart

export async function abortMultiPartUpload(key, uploadId){
    const cmd = new AbortMultipartUploadCommand({
        Bucket:BUCKET,
        Key:key,
        UploadId:uploadId
    })

    return await s3.send(cmd);
}

// helper to get object metadata (size, etag)

export async function headObject(key){
    const cmd = new HeadObjectCommand({
        Bucket:BUCKET,
        Key:key
    })

    return await s3.send(cmd)
}