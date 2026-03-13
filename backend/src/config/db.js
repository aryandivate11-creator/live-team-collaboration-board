import mongoose from "mongoose";

const connectDB = async () =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}${process.env.DB_NAME}`);
        console.log("Database connected successfully !");
        console.log(`connected to instance ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("DB connection error :",error);
        process.exit(1);
    }
};

export default connectDB;