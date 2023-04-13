const User = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const config = require("../Config/config");
const NodeMailer = require("nodemailer")

const exceljs = require("exceljs");
//html to pdf generate require things**
const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');
const { options, response } = require("../Routes/adminRoute");

const SecurePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}
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
            html:'<p>Hii '+name+', Please Click Here to <a href="http://127.0.0.1:3000/admin/forget-password?token='+token+'"> Reset </a> Your Mail.</p>'
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
const loadLogin = async(req,res)=>{
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}
const verfiyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email});
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                if(userData.is_admin === 0){
                res.render('login',{message:"Email And Password Is Incorrect"});
                }else{
                    req.session.user_id = userData._id;
                    res.redirect("/admin/home");
                }
            }else
            {
            res.render('login',{message:"Email And Password Is Incorrect"});
            }
        }else{
            res.render('login',{message:"Email And Password Is Incorrect"});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async(req,res)=>{
    try {
        const userData = await User.findById({_id:req.session.user_id});
        res.render('home',{admin:userData});
    } catch (error) {
        console.log(error.message);
}
}

const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
}
}
const forgetLoad = async(req,res)=>{
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message);
}
}
const forgetVerfiy = async(req,res)=>{
    try {
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if(userData){
            if(userData.is_admin === 0){
            res.render('forget',{message:"Email is incorrect"});
            }else{
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{token:randomString}});
                SendResetPMail(userData.name, userData.email, randomString);
                res.render('forget',{message:"Please Check Your Mail To Reset Your Password"});
            }
        }else{
            res.render('forget',{message:"User Not Found"});
        }
    } catch (error) {
        console.log(error.message);
}
}
const forgetPasswordLoad = async(req,res)=>{
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({token:token});
        if(tokenData){
            res.render('forget-password',{user_id:tokenData._id});
        }else{
            res.render('404',{message:"Invaid Token"});
        }
    } catch (error) {
        console.log(error.message);
}
}
const ResetPassword = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const securePass = await SecurePassword(password);
        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:securePass,token:''}});
        res.redirect('/admin');    
    } catch (error) {
        console.log(error.message);
}
}
const adminDashboardLoad = async(req,res)=>{
    try {
        var search = '';
        if(req.query.search)
        {
            search = req.query.search;
        }
        var page = '1';
        if(req.query.page)
        {
            page = req.query.page;
        }
        const limit =2;
        const usersData = await User.find({
            is_admin:0,
            $or:[ 
                {name:{ $regex:'.*'+search+'.*',$options:'i'}},
                {email:{ $regex:'.*'+search+'.*',$options:'i'}},
                // {mobile:{ $regex:`.*`+search+`.*`,$options:`i`}}
                {mobile:{$regex:'.*'+search+'.*',$options:'i'}}
            ]
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.find({
            is_admin:0,
            $or:[ 
                {name:{ $regex:'.*'+search+'.*',$options:'i'}},
                {email:{ $regex:'.*'+search+'.*',$options:'i'}},
                // {mobile:{ $regex:'.*'+search+'.*'}}
            ]
        }).countDocuments();

        res.render('admindashboard',{
            users:usersData,
            totalPages:Math.ceil(count/limit),
            currentPage:page,
            previous:page-1,
            next:page+1,
        });
    } catch (error) {
        console.log(error.message);
    }
}
const adduserLoad = async(req,res)=>{
    try {
        res.render('new-user');
    } catch (error) {
        console.log(error.message);
    }
}
//for Send Mail
const addUserMail = async(name, email, password, user_id)=>{
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
            subject:'Admin has added please verify your mail.',
            html:'<p>Hii '+name+', Please Click Here to <a href="http://127.0.0.1:3000/verify?id='+user_id+'"> Verify </a> Your Mail.</p> <br> <br> <b>Email:-'+email+' <br> <b>Password:-'+password+'</b></b>'
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
const adduser = async(req,res)=>{
    try {
        const name =  req.body.name;
        const email =  req.body.email;
        const mobile =  req.body.mobile;
        const image =  req.file.filename;
        const password = randomstring.generate(10);

        const spassword = await SecurePassword(password);
        const user = new User({
            name:name,
            email:email,
            mobile:mobile,
            image:image,
            password:spassword,
            is_admin:0
        });
        const userData = await user.save();
        if(userData){
            addUserMail(userData.name, userData.email, userData.password, userData._id);
            res.redirect('/admin/dashboard');
        }else{
            res.render('new-user',{message:"Something went wronge."})
        }
    } catch (error) {
        console.log(error.message);
    }
}
//edituserload Method
const edituserload = async(req,res)=>{
    try {
        const id = req.query.id;
        const userData = await User.findById({_id:id});
        if(userData){
            res.render('edituser',{user:userData});
        }
        else
        {
            res.redirect('/admin/dashboard');
        }
        res.render('edituser');
    } catch (error) {
        console.log(error.message);
    }
}
//edituser-load-Method
//edituser-button-Method
const updateuserload = async(req,res)=>{
    try {
        const userData = await User.findByIdAndUpdate({_id:req.body.id},{$set:{ name:req.body.name, email:req.body.email, mobile:req.body.mobile, is_varified:req.body.verify}});
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error.message);
    }
}
//deleteuserButton-Method
const deleteuser = async(req,res)=>{
    try {
        const id = req.query.id;
        await User.deleteOne({_id:id});
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error.message);
    }
}
//exportsuser-data
const exportusers = async(req,res)=>{
    try {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("My Users");
        worksheet.columns = [
            { header:"S no.", key:"s_no"},
            { header:"Name", key:"name",},
            { header:"Email I'd", key:"email"},
            { header:"Mobile Number", key:"mobile"},
            { header:"Image", key:"image"},
            { header:"Is Admin", key:"is_admin"},
            { header:"Is Varified", key:"is_varified"}
        ];
        let counter = 1;
        const userData = await User.find({is_admin:0});
        userData.forEach((user)=>{
            user.s_no = counter;
            worksheet.addRow(user);
            counter++;
        });
        worksheet.getRow(1).eachCell((cell)=>{
            cell.font = { bold:true};
        });
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
        );
        res.setHeader("Content-Disposition",'attachement; filename=users.xlsx');
        return workbook.xlsx.write(res).then(()=>{
            res.status(200);
        });
    } catch (error) {
        console.log(error.message);
    }
}
//exportsuser-data
//exportuser-data-into-pdf
const exportuserspdf = async(req,res)=>{
    try {
        const users = await User.find({is_admin:0});
        const data = {
            users:users
        }
        const filepath = path.resolve(__dirname,'../Views/admin/htmltopdf.ejs');
        const htmlString = fs.readFileSync(filepath).toString();
        let options = {
            format:'A3', //Letter
            orientation:"portrait",
            border:"10mm"
        }
        const ejsData = ejs.render(htmlString, data);
        pdf.create(ejsData,options).toFile('users.pdf',(err,response)=>{
            if(err) console.log(err);

            const filepath = path.resolve(__dirname,'../users.pdf');
            fs.readFile(filepath,(err,file)=>{
                if(err){
                    console.log(err);
                    return res.status(500).send('Could Not Download file');
                }
                res.setHeader('Content-Type','application/pdf');
                res.setHeader('Content-Disposition','attachement;filename="users.pdf"');
                res.send(file);
            });
        });
    } catch (error) {
        console.log(error.message);
    }
}
//exportuser-data-into-pdf


module.exports = {
    loadLogin,
    verfiyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetVerfiy,
    forgetPasswordLoad,
    ResetPassword,
    adminDashboardLoad,
    adduserLoad,
    adduser,
    edituserload,
    updateuserload,
    deleteuser,
    exportusers,
    exportuserspdf
}