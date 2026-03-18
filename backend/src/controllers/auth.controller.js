import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateAccessandRefershToken = async (userId) =>{
    const user =  await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({validateBeforeSave : false});

    return {accessToken , refreshToken};
};

export const registerUser = asyncHandler(async (req, res) =>{
    const {name , email , phone , password} = req.body

    if(!name || !email || !password){
        throw new ApiError(400,"Name , Email and password are required !")
    };

    const nameRegex = /^[A-Za-z\s]+$/;
    if(!(nameRegex.test(name))){
        throw new ApiError(400,"Name should contain only letters")
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!(emailRegex.test(email))){
        throw new ApiError(400,"Invalid email format")
    };

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if(!(passwordRegex.test(password))){
        throw new ApiError(400,"Password must be at least 8 characters long and include uppercase, number, and special character")
    };

    if(phone){
        const phoneRegex = /^[6-9]\d{9}$/;
        if(!(phoneRegex.test(phone))){
            throw new ApiError(400,"Phone number must be 10 digits and start with 6, 7, 8, or 9")
        };
    };

    const existingUser = await User.findOne({email});
    if (existingUser) {
        throw new ApiError(400, "User already exists with this email");
    };

    const user = await User.create({
        name,
        email,
        password,
        phone
    });
    
    const {accessToken , refreshToken} = await generateAccessandRefershToken(user._id);

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
    const options = {
        httpOnly: true,
        secure: false
    };

    return res
    .status(201)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            201,
            {
                user : createdUser,
                accessToken
            },
            "User registered successfully")
    );
});

export const loginUser = asyncHandler(async (req,res) =>{
    const {email , password} = req.body;

    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404,"User not found")
    };

    const isPasswordCorrect = await user.comparePassword(password);

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid Credentials")
    };

    const {accessToken , refreshToken} = await generateAccessandRefershToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
    const options = {
        httponly : true,
        secure : false
    };

    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
        {
            user:loggedInUser,
            accessToken
        },
        "User logged in successfully")
    );
});

export const refreshAccessToken = asyncHandler(async (req,res) =>{

    const incomingRefreshToken = req.cookies.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh Token missing !")
    };

    try {
        const decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decoded._id);

        if(!user){
            throw new ApiError(401,"Invalid Referesh Token ")
        };

        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401,"Refresh token expired or reused ")
        };

        const newAccessToken = user.generateAccessToken();

        return res.status(200).json(
            new ApiResponse(200 , {accessToken : newAccessToken},"Access token refreshed")
        );
    } catch (error) {
         throw new ApiError(401,"Invalid Refresh Token")
    }
});

export const logoutUser = asyncHandler(async (req,res)=>{

    const token = req.headers.authorization?.split(" ")[1];

    if(!token){
        throw new ApiError(401 , "Unauthorized")
    };

    const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

    const userId = decoded._id;

    await User.findByIdAndUpdate(
        userId,
        {
            $unset : {refreshToken : 1}
        }
    );

    const options = {
        httponly : true,
        secure : false
    };

    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200 , {}, "User logged out successfully"));
});