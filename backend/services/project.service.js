const { default: mongoose } = require('mongoose');
const projectModel = require('../models/project.model');


const createProject = async ({ name, userId }) => {
    if (!name) {
        throw new Error('Name is required');

    }
    if (!userId) {
        throw new Error("user is required");
    }

    let project;
    try {

        project = await projectModel.create({
            name: name,
            users: [userId],
        });

    }
    catch (error) {
        if (error.code === 11000) {
            throw new Error('Project name already Exists');
        }

        throw error
    }

    return project;
}

const getAllProjectsById = async ({ userId }) => {
    if (!userId) {
        throw new Error("userId must be required");
    }

    const getUsersAllProjects = await projectModel.find({ users: userId });

    return getUsersAllProjects;
}

const addUserToproject = async ({ projectId, users, userId }) => {

    if (!projectId) {
        throw new Error("ProjectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users) {
        throw new Error("users is required")
    }

    if (!Array.isArray(users) || users.some(userId =>
        !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }
    if (!userId) {
        throw new Error("UserId is required")
    }

    const project = await projectModel.findOne({ _id: projectId, users: userId })

    if (!project) {
        throw new Error("user not belongs to this project");
    }

    const updatedProject = await projectModel.findOneAndUpdate({
        _id: projectId,
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    },
        {
            new: true,
        }
    )
    return updatedProject;
};

const getProjectById = async ({ projectId }) => {

    if (!projectId) {
        throw new Error("ProjectId is required");
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Inavlid projectId");
    }


    const projectDetails = await projectModel.find({ _id: projectId }).populate('users');
    return projectDetails;
}

const updateFileTree = async ({ projectId, fileTree }) => {
    if (!projectId) {
        throw new Error("projectId is required");

    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId");
    }

    if (!fileTree) {
        throw new Error("fileTree is required");
    }

    const project = await projectModel.findOneAndUpdate({
        _id: projectId,

    },
        {
            fileTree
        },
        {
            new: true
        }) 
         return project
}


module.exports = { createProject, getAllProjectsById, addUserToproject, getProjectById , updateFileTree};


