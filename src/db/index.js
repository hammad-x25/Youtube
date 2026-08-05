import mongoose, { mongo } from "mongoose";
import {DB_NAME} from "../constants.js"

export const DBconnect=async()=>
{
    try {
        const databaseinstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log("Dtabase instance created :", databaseinstance.connection.host)
    } catch (error) {
        console.log("Error while database Loading",error);
        process.exit(1);
    }
}