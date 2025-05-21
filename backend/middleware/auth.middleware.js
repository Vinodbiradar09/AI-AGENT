const jwt = require('jsonwebtoken');
const redisClient = require('../services/redis.service');

const userAuthMiddleware = async (req , res , next)=>{
    try{
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];
        if(!token){
            res.status(401).send({error : "Unauthorized User"});
        }

        const isBlacklisted = await redisClient.get(token);

        if(isBlacklisted){
            res.cookie('token' , '');
            return res.status(401).send({error : "Unauthorized User"});
        }

        const decoded = jwt.verify(token , process.env.JWT_SECRET);
        req.user = decoded;
        next();

    }
    catch(error){
        res.status(401).send({error : "Unauthorized User"});
    }
}

module.exports = userAuthMiddleware;