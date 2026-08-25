import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import  jwt  from "jsonwebtoken";
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
  },
  password: {
    type: String,
    required: [true, "Paasowrd is Required"],
    min: 8,
  },
  refreshToken: {
    type: String,
  },
  WatchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ]
},{timestamps:true});

UserSchema.pre("save", async function(next) {
    try {
        if (!this.isModified("password")) {
            return;
        }

        this.password = await bcrypt.hash(this.password, 7);

        
    } catch (error) {
        throw (error);
    }
});

UserSchema.methods.isPasswordCorrect=async function(password) {
  return await bcrypt.compare(password,this.password);
}

UserSchema.methods.generateAccessToken=function()
{
    return jwt.sign(
        {
            _id:this._id,
            fullName:this.fullName,
            username:this.username,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

UserSchema.methods.generateRefreshToken=function()
{
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User=mongoose.model("User",UserSchema);

