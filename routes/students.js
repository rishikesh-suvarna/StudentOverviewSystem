var express = require("express"),
router  = express.Router(),
passport = require('passport'),
mongoose = require('mongoose'),
GridFsStorage = require('multer-gridfs-storage'),
Grid = require('gridfs-stream'),
Student = require('../models/students'),
Teacher = require('../models/teachers');

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

// <=============================================== Routes =====================================================>

router.get('/students', (req, res) => {
    res.render('student/index')
});

router.get('/students/login', (req, res) => {
    res.render('student/login');
});

router.post('/students/login', passport.authenticate('studentLocal', {successRedirect: '/students', failureRedirect: '/students/login', successFlash: 'Welcome', failureFlash: true}), function(req, res){ 
});

router.get('/students/viewtest', (req, res) => {
    const filesToShow = [];
    gfs.files.find().toArray((err, files) => {
        if(!files || files.length === 0) {
            res.render('student/viewtest', {files: false});
        } else {
            files.forEach(function(file){
                // console.log("<======================================>")
                var s = JSON.stringify(file.metadata.id);
                if(s == "\""+req.user.teacher+"\""){
                    filesToShow.push(file);
                }
            });
            res.render('student/viewtest', {files: filesToShow});
        }
    });
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/index')
});

module.exports = router;