var express = require("express"),
router  = express.Router(),
passport = require('passport'),
Student = require('../models/students'),
Teacher = require('../models/teachers');

router.get('/students', (req, res) => {
    res.render('student/index')
});

router.get('/students/login', (req, res) => {
    res.render('student/login');
});

router.post('/students/login', passport.authenticate('studentLocal', {successRedirect: '/students', failureRedirect: '/students/login', successFlash: 'Welcome', failureFlash: true}), function(req, res){ 
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
});

module.exports = router;