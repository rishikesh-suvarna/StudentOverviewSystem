var express = require("express"),
    router  = express.Router(),
    mongoose          = require('mongoose'),
    GridFsStorage     = require('multer-gridfs-storage'),
    Grid              = require('gridfs-stream'),
    nodemailer        = require('nodemailer'),
    Student = require('../models/students'),
    bcrypt = require('bcryptjs'),
    { check, validationResult, body } = require('express-validator'),
    Teacher = require('../models/teachers'),
    middleware = require('../middleware');

// <===================================== Database =========================================>
const mongoURI = process.env.MONGODB_URL;
const conn = mongoose.createConnection(mongoURI, {useUnifiedTopology: true });
// <============================================ GFS =========================================>
let gfs;

conn.once('open',() => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    // all set!
});  

// ======================================= Nodemailer ===========================================>
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'login',
        port: 465,
        secure: true,
        user: process.env.USER,
        pass: process.env.PASS
    }
});


// <====================================== Routes ================================================>
router.get('/admin', (req, res) => 
    res.render('admin/index'));

router.get('/admin/login', (req, res) => {
    req.logOut();
    res.render('admin/login');
});

router.post('/admin/login', (req, res) => {
    if(req.body.username && req.body.password === "admin"){
        adminStatus = true;
        req.flash('success', 'Welcome!');
        return res.redirect('/admin');
    } else {
        req.flash("error", "Wrong Username or Password");
        res.redirect('/admin/login');
    }
});

router.get('/admin/add', (req, res) => {
    const errors = [];
    adminStatus = true;
    res.render('admin/add', {errors: false, formData: false});
});
    

router.post('/admin/add', [
    check('email', 'Invalid Email Id').isEmail(), 
    check('password', 'Password should be 6 charcters or more').isLength({min: 5}),
    body('cpassword').custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        
        // Indicates the success of this synchronous custom validator
        return true;
      })   
    ], (req, res) => {
    const errors = validationResult(req).array();
    if (errors.length > 0) {
        var name = req.body.name;
        var email = req.body.email;
        var username = req.body.username;
    
        var formData = {
            name: name,
            email: email,
            username: username
        }
        return res.render('admin/add', {errors: errors, formData: formData});
      }
        var name = req.body.name.trim(),
        email = req.body.email.trim(),
        username = req.body.username.trim(),
        password = req.body.password.trim(),
        designation = "Teacher"

        var newUser = new Teacher ({
            name: name,
            email: email,
            username: username,
            password: password,
            designation: designation
        });
        Teacher.getUserByUsername(username, function(err, teacher){
            if(teacher){
                req.flash('error', 'Username is already registered');
                return res.redirect('/admin/add');
            } else {
                const data = `
                <div style="width: 40%; border: 2px dotted black; padding: 30px; font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;">
                    <h3>You're Successfully Added As A Teacher</h3>
                    <div style="text-align: center; padding: 20px;">
                        <img src="https://i.pinimg.com/originals/cd/88/6e/cd886e4afd07dafeee0f1bc4872740f9.png" alt="teacher-img" style="width: 50%; border-radius: 50%; border: 2px solid black;">
                    </div>
                    <p>Here are your account details: </p>
                    <ul>
                        <li>Name: ${name}</li>
                        <li>Email: ${email}</li>
                        <li>Username: ${username}</li>
                    </ul>
                    <p><strong>Note: </strong>For password contact admin</p>
                    <a href="https://ancient-oasis-06214.herokuapp.com/teachers/login">Click Here To Login</a>
                </div>
                `;
                let mailOptions = {
                    from: 'developer.rs2020@gmail.com',
                    to: email,
                    subject: 'Student Overview System',
                    text: 'Account Created',
                    html: data
                }
                transporter.sendMail(mailOptions, (err, data) => {
                    if(err){
                        console.log(err);
                    } else {
                        console.log("Sent!")
                    }
                });
                Teacher.createUser(newUser, function(err, user){
                if(err) throw err;
                req.flash('success', 'Email has been sent!')
                res.redirect('/admin');
                });
            }
        });
});



router.get('/admin/manage', (req, res) =>{
    Teacher.find({}, (err, allTeachers) => {
        if(err){
            console.log(err);
        }else {
            res.render('admin/manage', {teachers: allTeachers})
        }
    });
});

router.get('/admin/manage/:id/edit', (req, res) => {
    Teacher.findById(req.params.id, (err, foundTeacher) => {
        if(err){
            console.log(err);
        } else {
            res.render('admin/edit', {teacher: foundTeacher});
        }
    });
});

router.put('/admin/manage/:id/edit', (req, res) => {
    Teacher.findByIdAndUpdate(req.params.id, req.body.teacher, (err, updatedTeacher) => {
        if(err){
            console.log(err);
        }
        req.flash('success', 'Successfully Updated Teacher');
        res.redirect("/admin/manage");
    });
    
});

router.get('/admin/manage/:id/resetpassword', (req, res) => {
    var query = {_id: req.params.id}
    Teacher.findOne(query, (err, foundTeacher) => {
        res.render('admin/resetpassword', {teacher: foundTeacher});
    });
});

router.put('/admin/manage/:id/resetpassword', (req, res) => {
    var query = {_id: req.params.id}
    Teacher.findOne(query, (err, foundTeacher) => {
        foundTeacher.password = req.body.password;
        Teacher.resetPassword(foundTeacher, function(err, user){
            if(err) throw err;
        });
        req.flash("success", "Password Reset Successfully!")
        res.redirect('/admin/manage');
    });
    // Teacher.createUser(newUser, function(err, user){
    //     if(err) throw err;
    // });
});

router.delete('/admin/manage/:id', (req, res) => {
    // Teacher.findByIdAndDelete(req.params.id, (err) =>{
    //     if(err){
    //         console.log(err);
    //     }
    //     res.redirect("/admin/manage");
    // });

    Teacher.findById(req.params.id).populate('myStudents').exec(async function(err, foundTeacher){
        if(err){
            console.log(err);
        } try {
            await foundTeacher.myStudents.forEach(function(student){
                Student.findByIdAndDelete(student._id, function(err){
                    if(err){
                        console.log(err);
                    }
                    // const i = foundTeacher.myStudents.indexOf(student._id)
                });
            });
            foundTeacher.remove();
            res.redirect("/admin/manage");
            await foundTeacher.myTests.forEach(function(file){
                gfs.remove({_id: file, root: 'uploads'}, (err, file) => {
                    if(err){
                        console.log(err);
                    }
                });
            });
        }
         catch(err){
            res.redirect("/admin/manage");
        }
    });
});

function adminLogin(req, res, next){
    if(adminStatus){
        return next;
    }
    else {
        req.flash("error", "You need to be logged in");
        res.redirect('/admin/login');
    }
}

module.exports = router;