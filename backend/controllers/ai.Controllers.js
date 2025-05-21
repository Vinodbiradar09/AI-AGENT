const generateResult = require('../services/ai.service');


const getResult = async (req , res)=>{
    try{

        const {prompt} = req.query;

        const result = await generateResult(prompt);
        res.send(result);

    }
    catch(err){
        res.status(400).json({
            message : err.message,
        })
    }
}

module.exports = getResult;


