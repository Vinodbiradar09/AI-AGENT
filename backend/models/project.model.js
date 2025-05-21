const {Schema , model, default: mongoose} = require('mongoose');


const projectSchema = new Schema({

    name : {
        type : String,
        required : true,
        trim : true,
        lowercase : true,
        unique : true,
    },

    users : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "ai-agent-users",
        }
    ],

    fileTree : {
        type : Object,
        default : {},
    }



});

const projectModel = model('project' , projectSchema);

module.exports = projectModel;
