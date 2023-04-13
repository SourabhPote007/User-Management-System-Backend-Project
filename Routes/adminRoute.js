const express = require("express");
const adminRoute = express();
const session = require("express-session");
const config = require("../Config/config");
adminRoute.use(session({secret:config.sessionSecret}));

const bodyParser = require("body-parser");
adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({extended:true}));

adminRoute.set('view engine','ejs');
adminRoute.set('views','./views/admin');


const multer = require("multer");
const path = require("path");
adminRoute.use(express.static('Public'));
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../Public/userimages'));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});
const upload = multer({storage:storage});//uploadimage-storage-image-route

const auth = require("../middleware/adminauth");//admin-auth-islogin-islogout-middleware-route
const adminController = require("../Controllers/adminController");//controller-adminfunction-route
adminRoute.get('/',auth.islogout,adminController.loadLogin);//AdminLogin-load-view-route

adminRoute.post('/',adminController.verfiyLogin);
adminRoute.get('/home',auth.islogin,adminController.loadDashboard);//Adminlogin-load-view-dashboard-userlist-route

adminRoute.get('/logout',auth.islogin,adminController.logout);//Adminlogin-view-logout-button-route
adminRoute.get('/forget',auth.islogout,adminController.forgetLoad);//Adminlogin-user-forget-password-email-load-Veiw-route
adminRoute.post('/forget',adminController.forgetVerfiy);//Adminlogin-user-Email-forget-mail-send-verification-link-route
adminRoute.get('/forget-password',adminController.forgetPasswordLoad);//Admin-Login-Forget-Password-route
adminRoute.post('/forget-password',auth.islogout,adminController.ResetPassword);//Admin-Password-Reset-Button-Password-route


adminRoute.get('/dashboard',auth.islogin,adminController.adminDashboardLoad);//Admin-Data-dashboard-UserList--Route
adminRoute.get('/new-user',auth.islogin,adminController.adduserLoad);//User-Registration-form-Load-Data--Route
adminRoute.post('/new-user',upload.single('image'),adminController.adduser);//Add-New-User-Button--Route

adminRoute.get('/edituser',auth.islogin,adminController.edituserload); //User-Edit--Route
adminRoute.post('/edituser',adminController.updateuserload);//Update-User-Button--Route
adminRoute.get('/deleteuser',adminController.deleteuser);//Delete-User-Button--Route

adminRoute.get('/exportusers',auth.islogin,adminController.exportusers);//-Export-Users-Data-In-Excel.xslx-Route
adminRoute.get('/exportuserspdf',auth.islogin,adminController.exportuserspdf);//-Export-Users-Data-In-PDF.pdf-Route

adminRoute.get('*',function(req,res){
    res.redirect('/admin');
});//this.default-route-of-any-website-
module.exports = adminRoute;