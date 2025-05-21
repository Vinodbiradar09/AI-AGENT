const express = require('express');
const morgan = require('morgan');

const connectDB = require('./db/dbs');

const userRoutes = require('./routes/user.routes')

const projectRoutes = require('./routes/project.routes');

const aiRoutes = require('.//routes/ai.routes');

const cookieparser = require('cookie-parser');

const cors = require('cors');

const app = express();


connectDB();

// app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(cookieparser());

app.use(express.urlencoded({extended:true}));

app.use('/users' , userRoutes);
app.use('/projects' , projectRoutes);
app.use('/ai' , aiRoutes);

app.get('/' , (req , res)=>{
    res.send("Own Ai agent");
});

module.exports = app;



