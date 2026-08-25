import { apierror } from "./apierror.js";

export const getPublicIdFromUrl = (url) => {
    if (!url) {
        throw new apierror(400, "URL is required");
    }

    const cleanUrl = url.split("?")[0].split("#")[0];
    const fileName = cleanUrl.split("/").pop();
    return fileName.includes(".") ? fileName.slice(0, fileName.lastIndexOf(".")) : fileName;
};
