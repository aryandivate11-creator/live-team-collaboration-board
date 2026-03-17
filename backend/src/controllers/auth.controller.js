import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";

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

    const createdUser = await User.findById(user._id).select("-password");

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User registered successfully")
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

    const accessToken =  user.generateAccessToken();
    const refreshToken =  user.generateRefreshToken();

    const loggedInUser = await User.findById(user._id).select("-password");

    return res.status(200).json(
        new ApiResponse(200,{
            user:loggedInUser,
            accessToken,
            refreshToken,
        },"User logged in successfully")
    );
});