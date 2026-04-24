import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js";
dotenv.config();

import connectDB from "./db/index.js";
/*
const app = express()
    (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

            app.on("ERROR", (error) => {
                console.log("ERROR :", error);
                throw error
            })
            
            app.listen(process.env.PORT, () => {
                console.log(`app is listening on port: ${process.env.PORT}`);
            })

        } catch (error) {
            console.error("ERROR: ", error);
            throw err
        }
        

    })()
    this is example of connecting database via main index file but its clusterd with other code so we use diff folder of DB
    in there we creat diff file to connect to database and then export to use
*/
connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("error", error);
            throw error
            
        });// app.on is generally not necessary only to learn (use is to catch app level error form express)
        const port = process.env.PORT || 8000
        app.listen(port, () => {
            console.log(`server is running at ${port}`);
            
        });
    })
    .catch((err) => {
        console.log("MongoDB connection Failed!", err);
        process.exit(1);
        
    });