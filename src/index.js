import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js";
dotenv.config();

import connectDB from "./db/index.js";
import { app } from "./app.js";

/*
    (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

            app.on("ERROR", (error) => {
                console.log("ERROR :", error);
                throw error;
            });

            app.listen(process.env.PORT, () => {
                console.log(`app is listening on port: ${process.env.PORT}`);
            });
        } catch (error) {
            console.error("ERROR: ", error);
            throw error;
        }
    })();

    This is an example of connecting the database from the main index file, but it
    clusters other concerns, so we use a separate db folder: a dedicated file to
    connect and export for reuse.
*/
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("error", error);
      throw error;
    }); // app.on is optional — mainly for learning (catch app-level errors from Express)
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`server is running at ${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection Failed!", err);
    process.exit(1);
  });
