const express = require("express");
const UserRoute = express();
const session = require("express-session");
const config = require("../Config/config");
UserRoute.use(express.static('Public'));

UserRoute.use(session({secret:config.sessionSecret}));

const auth = require("../middleware/auth");

UserRoute.set('view engine','ejs');
UserRoute.set('views','./Views/Users');

const bodyParser = require('body-parser');
UserRoute.use(bodyParser.json());
UserRoute.use(bodyParser.urlencoded({extended:true}));

const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../Public/userimages'));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});
const upload = multer({storage:storage});

const UserController = require("../Controllers/UserController");
UserRoute.get('/register',auth.islogout,UserController.LoadRegister);
UserRoute.post('/register',upload.single('image'),UserController.insertUser);
UserRoute.get('./verify',UserController.verifyMail);

UserRoute.get('/',auth.islogout,UserController.loginLoad);
UserRoute.get('/login',auth.islogout,UserController.loginLoad);
UserRoute.post('/login',UserController.verifyLogin);

UserRoute.get('/home',auth.islogin,UserController.loadHome);

UserRoute.get('/logout',auth.islogin,UserController.userlogout);

UserRoute.get('/forget',auth.islogout,UserController.forgetLoad);
UserRoute.post('/forget',UserController.ForgetVerify);
UserRoute.get('/forget-password',auth.islogout,UserController.forgetPasswordLoad);
UserRoute.post('/forget-password',UserController.resetPassword);

UserRoute.get('/Verification',UserController.verificationLoad);
UserRoute.post('/Verification',UserController.sentverificationLink);


UserRoute.get('/edit',auth.islogin,UserController.editLoad);
UserRoute.post('/edit',upload.single('image'),UserController.updateProfile);

module.exports = UserRoute;