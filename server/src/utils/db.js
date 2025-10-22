import mongoose from "mongoose";

export async function connectDB(url) {
  mongoose.set("strictQuery", false);
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

   console.log("MongoDB connected");
}
