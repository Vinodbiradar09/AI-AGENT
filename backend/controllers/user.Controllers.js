const userModel = require('../models/user.model');
const {validationResult} = require('express-validator');



const {createUser , getAllUsers} = require('../services/user.Service');
const redisClient = require('../services/redis.service');




const createUserController = async (req , res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors : errors.array()
        });
    }
    try{

    const user = await createUser(req.body);
 

    const token = await user.generateJWT();

       delete user._doc.password; // it is used for not showing the password at frontend or console.log in frontend

       res.status(201).json({user , token});
    

    }
    catch(error){
        res.status(400).send(error.message);
    }
}

const loginController = async (req , res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors : errors.array()
        });
    }

    try{
         const {email , password} = req.body;
         const user = await userModel.findOne({email:email}).select('+password'); // here select is used becoz is schema is marked it has select:false,

         if(!user){
            res.status(401).json({
                errors : "invalid credentails"
            })
         }

         const isMatch = await user.isValidPassword(password);
         if(!isMatch){
            res.status(401).json({
                errors : "invalid credentails"
            })
         };

         const token = await user.generateJWT();

         delete user._doc.password // it is used for not showing the password at frontend and here user is we have found him by findOne method

         res.status(201).json({user , token});

    }
    catch(error){
        res.status(400).send(error.message);
    }
}

const profileController = async (req , res)=>{
    try{
        console.log("middleware" , req.user);

        res.status(200).json({
            user : req.user,
        })

    }
    catch(error){
          res.status(400).send(error.message);
    }
}

const logoutController = async (req ,res)=>{
    try{
         const token = req.cookies.token || req.headers.authorization.split(' ')[1];

         redisClient.set(token, 'logout' , 'EX' , 60 * 60 * 24);

         res.status(200).json({
            message : 'Logged out successfully',
         })
    }
    catch(error){
        res.status(400).send(error.message);
    }
}

const getAllUserController = async (req , res)=>{
    try{

        const loggedInUser = await userModel.findOne({email : req.user.email});

        const allUsers = await getAllUsers({userId : loggedInUser._id});

        return res.status(200).json({
            users : allUsers,
        })


    }
    catch(error){
        res.status(400).send(error.message);
    }
}

module.exports = {createUserController , loginController , profileController , logoutController , getAllUserController} ;
