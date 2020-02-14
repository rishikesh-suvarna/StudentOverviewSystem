var express = require("express"),
router  = express.Router(),
passport = require('passport'),
mongoose = require('mongoose'),
path = require('path'),
crypto = require('crypto'),
multer = require('multer'),
GridFsStorage = require('multer-gridfs-storage'),
Grid = require('gridfs-stream'),
Student = require('../models/students'),
Teacher = require('../models/teachers');
middleware = require('../middleware');

// <======================================= Database Conn ==================================================>
const mongoURI = process.env.MONGODB_URL;
const conn = mongoose.createConnection(mongoURI, {useUnifiedTopology: true });

// <======================================== GFS ==============================================================>
let gfs;

conn.once('open',() => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    // all set!
});

// <=============================================== Storage Engine =============================================>

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
              tid: req.body.fileid,
              type: "Answer",
              by: req.user.name,
          };
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

// <=============================================== Routes =====================================================>

router.get('/students', middleware.isStudentLoggedIn, (req, res) => {
    res.render('student/index')
});

router.get('/students/login', (req, res) => {
    res.render('student/login');
});

router.post('/students/login', passport.authenticate('studentLocal', {successRedirect: '/students', failureRedirect: '/students/login', successFlash: 'Welcome', failureFlash: true}), function(req, res){ 
});

router.get('/students/viewtest', middleware.isStudentLoggedIn, (req, res) => {
    const filesToShow = [];
    gfs.files.find().toArray((err, files) => {
        if(!files || files.length === 0) {
            res.render('student/viewtest', {files: false});
        } else {
            files.forEach(function(file){
                var s = JSON.stringify(file.metadata.id);
                if(s == "\""+req.user.teacher+"\""){
                    filesToShow.push(file);
                }
            });
            res.render('student/viewtest', {files: filesToShow});
        }
    });
});

router.get('/students/viewtest/:tid/answertest',  middleware.isStudentLoggedIn, (req, res) => {
    gfs.findOne({_id: req.params.tid}, (err, qfile) => {
        // res.render('student/answertest', {file: file});
        Student.findById(req.user._id, (err, foundStudent) => {
            if(foundStudent.questions.includes(req.params.tid)){
                // console.log('answered');
                res.render('student/answertest', {file: false, qfile: qfile});
            } else {
                // console.log('not answered');
                res.render('student/answertest', {file: true, qfile: qfile});
            }
        });
    });  
});


router.post('/students/viewtest/:tid/answertest',  middleware.isStudentLoggedIn, upload.single('file'), (req, res) => {
    Student.findById(req.user._id, (err, foundStudent) => {
        // foundStudent.answeredTest.push(req.file.id);
        foundStudent.questions.push(req.body.fileid);
        foundStudent.save();
    });
    res.redirect("/students/viewtest");
});


router.get('/students/viewattendance', middleware.isStudentLoggedIn, (req, res) => {
    Student.findById(req.user._id, (err, foundStudent) => {
        res.render('student/viewattendance', {student: foundStudent});
    });
});


router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/index')
});

module.exports = router;