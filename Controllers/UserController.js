// const { model } = require('mongoose');
const User = require('../Models/UserModel');
const bcrypt = require('bcrypt');
const NodeMailer = require("nodemailer");
// const UserModel = require('../Models/UserModel');
const config = require("../Config/config");
const randomstring = require("randomstring");

const SecurePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}
//for Send Mail
const sendverifyMail = async(name, email, user_id)=>{
    try {
        const transporter = NodeMailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
        });
        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject:'For Verification Of Mail',
            html:'<p>Hii '+name+', Please Click Here to <a href="http://127.0.0.1:3000/verify?id='+user_id+'"> Verify </a> Your Mail.</p>'
        }
        transporter.sendMail(mailOptions, function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent :- ",info.response);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}
//for Send Mail

const LoadRegister = async(req,res)=>{
    try {
        res.render('registration');
    } catch (error) {
        console.log(error.message);
    }
}
const insertUser = async(req,res)=>{
    try {
        const spassword = await SecurePassword(req.body.password);
        const user = new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mobile,
            image:req.file.filename,
            password:spassword,
            is_admin:0
        });
        const userData = await user.save();
        if(userData){
            sendverifyMail(req.body.name, req.body.email, userData._id);
            res.render('registration',{message:"Your Registration has been successfull And Please verify your mail!"});
        }else
        {
            res.render('registration',{message:"Your Registration has been failed!"});
        }
    } catch (error) {
        console.log(error.message);
    }
}
const verifyMail = async(req,res)=>{
    try {
        const updateinfo = await User.updateOne({_id:req.query.id},{ $set:{is_varified:1}});
        console.log(updateinfo);
        res.render("email-verified");
    } catch (error) {
        console.log(error.message);
    }
}
//login User Method
const loginLoad = async(req,res)=>{
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}
const verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email});
        if(userData){
            const passwordmatch = await bcrypt.compare(password,userData.password);
            if(passwordmatch){
                if(userData.is_varified === 0)
                {
                    res.render('login',{message:"Please Verify Your Mail."});
                }else
                {
                    req.session.user_id = userData._id;
                    res.redirect('/home');
                }
            }else{
            res.render('login',{message:"Email and password is incorrect"});
            }
        }else{
            res.render('login',{message:"Email and password is incorrect"});
        }
    } catch (error) {
        console.log(error.message);
    }
}
//login User Method
//loadHome Method
const loadHome = async(req,res)=>{
    try {
        const userData = await User.findById({_id:req.session.user_id});
        res.render('home',{user:userData});
    } catch (error) {
        console.log(error.message);
    }
}
//loadHome Method
//Userlogout Method
const userlogout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}
//Userlogout Method
//Forget Password Method
const forgetLoad = async(req,res)=>{
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message);
    }
}
//ForgetVerify Method
const ForgetVerify = async(req,res)=>{
    try {
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if(userData){
            if(userData.is_varified === 0){
                res.render('forget',{message:"Please Verify Your Mail."});
            }else{
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{token:randomString}});
                SendResetPMail(userData.name,userData.email,randomString);
                res.render('forget',{message:"Please Check Your Mail To Reset Password!"});
            }
        }else{
            res.render('forget',{message:"Please Enter Valid User Email!"});
        }
    } catch (error) {
        console.log(error.message);
    }
}
//ForgetVerify Method
// For Reset Password SendMail
const SendResetPMail = async(name, email, token)=>{
    try {
        const transporter = NodeMailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
        });
        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject:'For Reset Password',
            html:'<p>Hii '+name+', Please Click Here to <a href="http://127.0.0.1:3000/forget-password?token='+token+'"> Reset </a> Your Mail.</p>'
        }
        transporter.sendMail(mailOptions, function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent :- ",info.response);
            }
        });
    } catch (error) {
        console.log(error.message);
    }
}
// For Reset Password SendMail
// forgetPasswordLoad Method
const forgetPasswordLoad = async(req,res)=>{
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({token:token});
        if(tokenData){
            res.render('forget-password',{user_id:tokenData._id});
        }else{
            res.render('404',{message:"Token is invalid"})
        }
    } catch (error) {
        console.log(error.message);
    }
}
// forgetPasswordLoad Method
// resetPassword Method
const resetPassword = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await SecurePassword(password);
        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_password}});
        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }
}
// resetPassword Method
// VerificationSend-Link Method
const verificationLoad = async(req,res)=>{
    try {
        res.render('Verification');
    } catch (error) {
        console.log(error.message);
    }
}
// VerificationSend-Link Method
// sentverificationLink Method
const sentverificationLink = async(req,res)=>{
    try {
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if(userData){
            sendverifyMail(userData.name, userData.email, userData._id);
            res.render('Verification',{message:"Reset Verification Mail Sent To Your Mail I'd"})
        }else{
            res.render('Verification',{message:"This Email I'd is not existing."});
        }
    } catch (error) {
        console.log(error.message);
    }
}
// sentverificationLink Method
//editLoad Method
const editLoad = async(req,res)=>{
    try {
        const id = req.query.id;
        const userData = await User.findById({_id:id});
        if(userData){
            res.render('edit',{user:userData});
        }else{
            res.redirect('/home');
        }
    } catch (error) {
        console.log(error.message);
    }
}
//editLoad Method
//updateProfile method
const updateProfile = async(req,res)=>{
    try {
        if(req.file){
            const userData = await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mobile, image:req.file.filename}});
        }else
        {
            const userData = await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mobile}});
        }
        res.redirect('/home');
    } catch (error) {
        console.log(error.message);
    }
}
//updateProfile method


module.exports = {
    LoadRegister,
    insertUser,
    verifyMail,
    loginLoad,
    verifyLogin,
    loadHome,
    userlogout,
    forgetLoad,
    ForgetVerify,
    forgetPasswordLoad,
    resetPassword,
    verificationLoad,
    sentverificationLink,
    editLoad,
    updateProfile
}