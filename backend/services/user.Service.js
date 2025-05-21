const userModel = require('../models/user.model');

const createUser = async ({email , password})=>{

    if(!email || !password){
        throw new Error('Email and Password is required');
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userModel.create({
        email : email,
        password : hashedPassword,
    })
    return user;
}


const getAllUsers = async({userId})=>{

    const users = await userModel.find({_id : { $ne:userId}}); // $ne is notequal to that one user who is loggedIn , it returns all the users accept one user who is loggedIn 

    return users;
    
}
   

module.exports = {createUser , getAllUsers};
