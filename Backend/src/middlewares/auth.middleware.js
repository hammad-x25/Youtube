import { User } from "../models/user.models.js";
import { apierror } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"
export const verifyJWT = asyncHandler(async (req, res, next) => {

    const accessToken =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
        throw new apierror(401, "Unauthorized");
    }

    const decodedToken = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id)
        .select("-password");

    if (!user) {
        throw new apierror(401, "Unauthorized");
    }

    req.user = user;

    next();
});
