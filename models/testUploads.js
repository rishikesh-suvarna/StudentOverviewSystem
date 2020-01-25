const mongoose = require('mongoose');

var testUploadSchema = new mongoose.Schema({
    CreatedBy: String,
    fileID: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('testUpload', testUploadSchema);