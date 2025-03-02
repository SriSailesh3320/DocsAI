import mongoose from "mongoose";

let connected = false;

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  //if the database is already connected ,dont connect
  if (connected) {
    console.log("already connected");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
    console.log("connected");
  } catch (error) {
    console.log(error);
  }
};
export default connectDB;
