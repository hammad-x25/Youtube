import {apierror} from "../utils/ApiError.js";

export const getPublicIdFromUrl = (url) => {
    if (!url) {
        throw new ApiError(400, "URL is required");
    }

    return url.split("/").pop().split(".")[0];
};