const {createProject , getAllProjectsById , addUserToproject , getProjectById , updateFileTree} = require('../services/project.service');
const projectModel = require('../models/project.model');
const userModel = require('../models/user.model');

const {validationResult} = require('express-validator');

const createProjectController = async (req , res)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            errors : errors.array()
        });
     }

    try{

     const {name} = req.body;
     const loggedInUser = await userModel.findOne({email : req.user.email});

     const userId = loggedInUser._id;

     const newProject = await createProject({name , userId}); // here we are sending the name , userId to the project services 

     res.status(201).json(newProject);
     

    }
    catch(err){
     res.status(400).send(err.message);
    }

}

const getAllProjectsController = async (req , res)=>{
    try{

        const loggedInUser = await userModel.findOne({email : req.user.email});

        const allUsersProjects = await getAllProjectsById({userId : loggedInUser._id}); // here we are sending the userId to the project services 

        res.status(200).json({
            projects : allUsersProjects,
        })

 }
    catch(err){
        console.log(err);
        res.status(400).json({
            error : err.message
        })
    };
}


const addUserToProjectController = async (req , res) =>{

    try{

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(400).json({
                errors : errors.array()
            });
        }

        const {projectId , users} = req.body;

        const loggedInUser = await userModel.findOne({
            email : req.user.email,
        })

        const project = await addUserToproject({projectId , users , userId : loggedInUser._id});

        return res.status(200).json({
            project
        })


    }
    catch(error){
        console.log(error);
        res.status(400).json({
            error : error.message
        })
    };

}

const getProjectByIdControllers = async(req, res)=>{
    try{
        const {projectId} = req.params;

        const project = await getProjectById({projectId})

        return res.status(200).json({
            project,
        })

    }
    catch(error){
        console.log(error);
        res.status(400).json({
            error : error.message
        })
    };
}

const updateFileTreeControllers = async (req , res)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    try{

        const {projectId , fileTree} = req.body;

        const project = await updateFileTree({projectId , fileTree});

        return res.status(200).json({
            project,
        })

    }
     catch(error){
        console.log(error);
        res.status(400).json({
            error : error.message
        })
    };
}

module.exports = {createProjectController , getAllProjectsController , addUserToProjectController , getProjectByIdControllers , updateFileTreeControllers} ;
