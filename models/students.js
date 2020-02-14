const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var studentSchema = new mongoose.Schema({
    name: String,
    email: String,
    username: String,
    password: String,
    teacher: mongoose.Schema.Types.ObjectId,
    designation: String,
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    attendanceP: [{
        type: String
    }],
    attendanceA: [{
        type: String
    }],
    attendanceEmail: [{
        type: String
    }]
});

var User = module.exports = mongoose.model('student', studentSchema);

var salt = bcrypt.genSaltSync(9);

module.exports.createUser = function(newUser, callback){
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

module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
}

module.exports.getUserByUsername = function(username, callback){
    var query = {$or:[{username: username}, {email: username}]};
    User.findOne(query, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        // res === true
        if(err) throw err;
        callback(null, isMatch);
    });
}