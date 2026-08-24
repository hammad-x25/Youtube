import mongoose, { Schema }  from "mongoose";

const tweetschema=new mongoose.Schema({
content:{
    type: String,
    required: true,
    trim: true
},
owner:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required: true,
     index:true
}
},{timestamps:true});

export const Tweets=mongoose.model("Tweets",tweetschema);
