import express from "express";
import cors from "cors"
import cookieparser from "cookie-parser"
import cookieParser from "cookie-parser";

const app = express()

//app.use(cors()) using this is enough but we can further config cors and how front end is taking data form us
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public")) //to store public assets (ps. public is just folder name can be anything)
app.use(cookieParser())


export { app }
