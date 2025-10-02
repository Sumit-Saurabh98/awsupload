// app.js - entry point
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const filesRoute = require("./routes/files");

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
}));
app.use(express.json({ limit: "500mb" })); 

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the File Upload Service" });
});


app.use("/api/files", filesRoute);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Mongo connected");
    app.listen(PORT, () => console.log("Server listening on", PORT));
  })
  .catch(err => {
    console.error("Mongo connection failed", err);
  });
