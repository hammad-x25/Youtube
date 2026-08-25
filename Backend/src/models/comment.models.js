import mongoose, { Schema }  from "mongoose";

const commentSchema=new mongoose.Schema({

content:{
    type: String,
    required: true
},
Videos:
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
}
},{timestamps:true});

commentSchema.index({
    Videos: 1
});
commentSchema.index({ owner: 1, Videos: 1, createdAt: -1 });

export const Comments=mongoose.model("Comments",commentSchema);
