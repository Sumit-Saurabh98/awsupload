import dotenv from "dotenv"
dotenv.config();
import express from "express"
import cors from "cors"
import helmet from "helmet";
import bodyParser from "body-parser"
import uploadRoutes from "./routes/uploadRoutes.js"
import { connectDB } from "./utils/db.js";

const app = express();
app.use(helmet())
app.use(cors({origin:true}))
app.use(bodyParser.json({limit:"500mb"}))
app.use(bodyParser.urlencoded({extended:true}))

app.use("/api/upload", uploadRoutes);

(
    async () =>{
        await connectDB(process.env.MONGO_URI);
        app.listen(process.env.PORT, ()=>{
            console.log(`Server is listening on port -> ${process.env.PORT}`)
        })
    }
)();