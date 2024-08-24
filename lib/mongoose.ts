import mongoose from "mongoose";

let isConnected = false;

export const connectToDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGODB_URI) {
    throw new Error("MongoDB URI is not provided");
  }
  if (isConnected) {
    console.log("=> using existing database connection");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    isConnected = true;
    console.log("MOngoDB connection established");
  } catch (error) {
    console.error("Error connecting to database: ", error);
  }
};
