import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        required : true,
        trim: true
    },
    email:{
        type : String,
        required : true,
        trim : true ,
        unique : true,
        lowercase : true,
        index : true
    },
    password:{
        type : String,
        required : true
    },
    avatar:{
        type : String,
        default : ""
    },
    phone:{
        type : String,
        trim : true,
        default : null
    }
},
{
    timestamps : true
}
);

userSchema.pre("save",async function(next){
    if(!(this.isModified("password"))) return ;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password);
};

userSchema.methods.generateAccessToken = function (){
    jwt.sign(
        {
            _id: this._id,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = function (){
    jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};

const User = mongoose.model("User",userSchema);

export default User;

