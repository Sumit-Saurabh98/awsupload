import mongoose  from "mongoose";

const partSchema = new mongoose.Schema({
    partNumber: Number,
    ETag: String,
    size:Number
}, {_id:false})

const S3Schema = new mongoose.Schema({
    bucket: String,
    ket:String,
    contentType:String,
    size:Number,
    etag:String,
    // for multipart
    uploadId:String,
    parts: [partSchema],
    status: { type: String, enum: ["pending","uploading","complete","aborted"], default: "pending" },
}, {_id:false})

const resourceSchema = new mongoose.Schema({
    resourceName: {type:String, required:true},
    description:{type:String},
    s3: S3Schema
}, {timestamps:true})

export default mongoose.models.Resource || mongoose.model("Resource", resourceSchema)