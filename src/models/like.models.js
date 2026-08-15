import mongoose, { Schema }  from "mongoose";

const LikeSchema=new mongoose.Schema({
comment:
{
    type: Schema.Types.ObjectId,
      ref: "Comments"
},
Video:
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    }
,
Likedby:{
    type:Schema.Types.ObjectId,
    ref:"User"
},
tweet:{
    type:Schema.Types.ObjectId,
    ref:"Tweets"
}
},{timestamps:true});

export const Likes=mongoose.model("Likes",LikeSchema);
