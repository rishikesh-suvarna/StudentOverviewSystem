const mongoose = require('mongoose');
// const Student  = require('./students');
var bcrypt = require('bcryptjs');

var teacherSchema = new mongoose.Schema({
    name: String,
    email: String,
    username: String,
    password: String,
    designation: String,
    myStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "student"
    }   
    ],
    myTests: [{
        type: mongoose.Schema.Types.ObjectId,
    }]
});

var User = module.exports = mongoose.model('teacher', teacherSchema);

var salt = bcrypt.genSaltSync(10);

module.exports.createUser = function(newUser, callback){
    // bcrypt.genSalt(10, function(err, salt) {
    //     bcrypt.hash(newUser.password, salt, function(err, hash) {
    //         // Store hash in your password DB.
    //         newUser.password = hash;
    //         newUser.save(callback);
    //     });
    // });
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
}

module.exports.resetPassword = function(newUser, callback){
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
}

module.exports.getUserByUsername = function(username, callback){
    var query = {username: username};
    User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        // res === true
        if(err) throw err;
        callback(null, isMatch);
    });
}

