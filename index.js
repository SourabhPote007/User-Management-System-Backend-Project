const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/User_Management_System");
const express = require("express");
const app = express();

const UserRoute = require('./Routes/UserRoute');
app.use('/',UserRoute);

const adminRoute = require('./Routes/adminRoute');
app.use('/admin',adminRoute);

app.listen(3000,function(){
    console.log("SERVER IS RUNNING...");
});