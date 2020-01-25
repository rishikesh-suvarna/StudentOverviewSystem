var express = require("express"),
    router  = express.Router(),
    mongoose          = require('mongoose'),
    GridFsStorage     = require('multer-gridfs-storage'),
    Grid              = require('gridfs-stream'),
    Student = require('../models/students'),
    bcrypt = require('bcryptjs'),
    Teacher = require('../models/teachers'),
    middleware = require('../middleware');

// ==============================================================================
const mongoURI = 'process.env.MONGODB_URL';
const conn = mongoose.createConnection(mongoURI, {useUnifiedTopology: true });

let gfs;

conn.once('open',() => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    // all set!
});  

router.get('/admin', (req, res) => 
    res.render('admin/index'));

router.get('/admin/login', (req, res) => {
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
    adminStatus = true;
    res.render('admin/add')
});
    

router.post('/admin/add', (req, res) => {
    var name = req.body.name,
        email = req.body.email,
        username = req.body.username,
        password = req.body.password,
        designation = "Teacher"

    var newUser = new Teacher ({
        name: name,
        email: email,
        username: username,
        password: password,
        designation: designation
    });

    Teacher.createUser(newUser, function(err, user){
        if(err) throw err;
    });
    res.redirect('/admin');
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