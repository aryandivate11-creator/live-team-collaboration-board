import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

User.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password);
};

const User = mongoose.model("User",userSchema);

export default User;

