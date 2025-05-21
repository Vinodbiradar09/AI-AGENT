

const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');

const projectModel = require('./models/project.model');

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { createServer } = require('http');

const generateResult = require('./services/ai.service');

dotenv.config();

const port = process.env.PORT;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Match your client origin exactly
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;// in backend we are importing it from the frontend using query.projectId in a variable projectId 

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error("Invalid projectId"));
        }

        socket.project = await projectModel.findById(projectId);// and here we are creating a new field or key called project in the socket and finding the id from the projectModel by findById (and were are passing the projectId) that we got from frontend

        if (!token) {
            return next(new Error("Authentication Error"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error("Authentication error"));
        }

        socket.user = decoded;
        next();
    }
    catch (error) {
        next(error);// if the next comes up with the error then the socket will not be connected
    }
}); // this is the middleware for the authenticated user only the user who has logged in they can only conect to this 

io.on('connection', (socket) => {
    socket.roomId = socket.project._id.toString();
    console.log("connected");



    socket.join(socket.roomId);// in sockets there are rooms and we can join the rooms using the projectId of the specific projectId

    socket.on('project-message', async data => {

        const message = data.newmessage;
       
        const savanaIsPresentInMessage = message.includes('@savana');
           socket.broadcast.to(socket.roomId).emit('project-message', data);


        if (savanaIsPresentInMessage) {

            const prompt = message.replace('@savana', '');

            const result = await generateResult(prompt);

            io.to(socket.roomId).emit('project-message', {
                newmessage: result,
                sender: {
                    _id: 'savana',
                    email: "SAVANA"
                }
            })


            return
        }

        console.log("messaage", data);
      
    });
    socket.on('disconnect', () => {
        console.log("user disconnected");
        socket.leave(socket.roomId);
    })
});

server.listen(port, () => {
    console.log(`server is running at ${port}`);
});

