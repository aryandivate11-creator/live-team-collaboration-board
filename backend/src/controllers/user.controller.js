import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const searchUsers = asyncHandler(async (req, res) => {
    const { search } = req.query;

    if (!search || search.trim() === "") {
        throw new ApiError(400, "Search query is required")
    };

    // 🔒 Escape regex
    const escapeRegex = (text) => {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    };

    const safeSearch = escapeRegex(search);

    const users = await User.find({
        $or: [
            { name: { $regex: safeSearch, $options: "i" } },
            { email: { $regex: safeSearch, $options: "i" } }
        ]
    })
    .select("name email")
    .limit(10); // 🔥 important

   return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    );
    
});