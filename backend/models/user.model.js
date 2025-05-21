// here we are  creating Schema and models 

const {Schema , model} = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
const userSchema = new Schema({
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        minLength : [6 , 'Email must be at least 6 characters long'],
        maxLength : [50 , 'Email must not be longer than 50 characters'],
    },

    password : {
        type : String,
        select : false,
    }
})




userSchema.statics.hashPassword = async function(password){
   
         return await bcrypt.hash(password , 10 );
        
}


  userSchema.methods.isValidPassword  =  async function (password){
    // console.log("password :", password + " and  " + "hashed password : " , this.password);
     return  await   bcrypt.compare(password , this.password);
}

userSchema.methods.generateJWT = function(){
  return  jwt.sign({email : this.email}  , process.env.JWT_SECRET, {expiresIn:'24h'});
  
}

const userModel = model("ai-agent-users" , userSchema);


module.exports =  userModel;

