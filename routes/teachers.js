var express = require("express"),
router  = express.Router(),
path              = require('path'),
crypto            = require('crypto'),
multer            = require('multer'),
mongoose          = require('mongoose'),
GridFsStorage     = require('multer-gridfs-storage'),
Grid              = require('gridfs-stream'),
passport = require('passport'),
Student = require('../models/students'),
Teacher = require('../models/teachers'),
TestUploads = require('../models/testUploads'),
middleware = require('../middleware');

//<============================================ Database URI =================================================>
const mongoURI = process.env.MONGODB_URL;
const conn = mongoose.createConnection(mongoURI, {useUnifiedTopology: true });

// <=========================================== Storage Engine ================================================>
let gfs;

conn.once('open',() => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    // all set!
});

// Here
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const metadata = {
              id: req.user._id,
              by: req.user.name,
              title: req.body.title,
              desc: req.body.desc
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            metadata: metadata,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
});
const upload = multer({ storage });

// <================================================= Routes ===================================================>

router.get('/teachers', middleware.isLoggedIn, (req, res) => 
    res.render('teacher/index'));

router.get('/teachers/login', (req, res) => {
    res.render('teacher/login');
});

router.post('/teachers/login', passport.authenticate('teacherLocal', {successRedirect: '/teachers', failureRedirect: '/teachers/login', failureFlash: true ,successFlash: 'Welcome'}), function(req, res){ 
});


router.get('/teachers/add', (req, res) =>
    res.render('teacher/add'));

router.post('/teachers/add', middleware.isLoggedIn, (req, res) => {
    
    var name = req.body.name,
        email = req.body.email,
        username = req.body.username,
        password = req.body.password,
        designation = "Student";

        var newStudent = new Student ({
            name: name,
            email: email,
            username: username,
            password: password,
            designation: designation
        });

        Student.createUser(newStudent, function(err, student){
            if(err) throw err;
            else {
                console.log("success");
                Teacher.findById(req.user._id, function(err, teacher){
                    teacher.myStudents.push(student);
                    teacher.save();
                });
                res.redirect('/teachers');
            }
        });
});

router.get('/teachers/manage', middleware.isLoggedIn, (req, res) =>{
    
    Teacher.findById(req.user._id).populate("myStudents").exec(function(err, foundStudent){
        if(err){
            console.log(err);
        } else {
            res.render('teacher/manage', {pupil: foundStudent});
        }
    });
});

router.get('/teachers/manage/:id/edit', middleware.isLoggedIn, (req, res) => {
    Student.findById(req.params.id, (err, foundStudent) => {
        if(err){
            console.log(err);
        } else {
            res.render('teacher/edit', {student: foundStudent});
        }
    });
});

router.put('/teachers/manage/:id/edit', middleware.isLoggedIn, (req, res) => {
    Student.findByIdAndUpdate(req.params.id, req.body.student, (err, updatedStudent) => {
        if(err){
            console.log(err);
        } else {
            console.log(updatedStudent);
            res.redirect('/teachers/manage');
        }
    });
});

router.delete('/teachers/manage/:id', middleware.isLoggedIn, (req, res) => {
    Student.findByIdAndDelete(req.params.id, (err) => {
        if(err){
            console.log(err);
        }
        return res.redirect('/teachers/manage');
    });
});

router.get('/teachers/manage/:id/resetpassword', middleware.isLoggedIn, (req, res) => {
    var query = {_id: req.params.id}
    Student.findOne(query, (err, foundStudent) => {
        if(err){
            console.log(err);
        }
        else {
            res.render('teacher/resetpassword', {student: foundStudent});
        }
    });
});

router.put('/teachers/manage/:id/resetpassword', middleware.isLoggedIn, (req, res) => {
    var query = {_id: req.params.id}
    Student.findOne(query, (err, foundStudent) => {
        foundStudent.password = req.body.password;
        Student.resetPassword(foundStudent, function(err, user){
            if(err) throw err;
        });
        req.flash("success", "Password Reset Successfully!")
        res.redirect('/teachers/manage');
    });
});

router.get('/teachers/addtest', middleware.isLoggedIn, (req, res) => {
    res.render('teacher/addtest');
});

router.post('/teachers/addtest', middleware.isLoggedIn, upload.single('file'), (req, res) => {
    Teacher.findById(req.user._id, (err, teacher) => {
        teacher.myTests.push(req.file.id);
        teacher.save();
    });
    req.flash('success', 'Test Upload Successfull'); 
    res.redirect('/teachers');
});

router.get('/teachers/managetest', middleware.isLoggedIn, (req, res) => {
    const filesToShow = [];
    gfs.files.find().toArray((err, files) => {
        if(!files || files.length === 0) {
            res.render('teacher/managetest', {files: false});
        } else {
            files.forEach(function(file){
                // console.log("<======================================>")
                var s = JSON.stringify(file.metadata.id);
                if(s == "\""+req.user._id+"\""){
                    filesToShow.push(file);
                }
            });
            res.render('teacher/managetest', {files: filesToShow});
        }
    });
});

router.delete('/teachers/managetest/:id', middleware.isLoggedIn, (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
        if (err) {
          return res.status(404).json({ err: err });
        }
        req.flash('success', 'Test deleted successfully!')
        res.redirect('/teachers/managetest');
    });
});

// <================================================= API =====================================================>

router.get('/files/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        if(!file || file.length === 0) {
            res.status(404).json({
                err: 'No files exist'
            });
        }
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
    });
});



router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;