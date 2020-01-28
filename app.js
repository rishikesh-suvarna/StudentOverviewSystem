require('dotenv').config();

const express         = require('express'),
    app               = express(),
    path              = require('path'),
    crypto            = require('crypto'),
    bodyParser        = require('body-parser'),
    mongoose          = require('mongoose'),
    multer            = require('multer'),
    GridFsStorage     = require('multer-gridfs-storage'),
    Grid              = require('gridfs-stream'),
    flash             = require("connect-flash"),
    passport          = require('passport'),
    LocalStrategy     = require('passport-local'),
    methodOverride    = require('method-override'),
    Student           = require('./models/students'),
    Teacher           = require('./models/teachers'),
    PORT              = process.env.PORT || 3000;   
// Deprecations
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true); 



// Setting Up Express-session
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
  
// Express-Config-Middlleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Database Connection
const mongoURI = process.env.MONGODB_URL;
mongoose.connect(mongoURI);
const conn = mongoose.createConnection(mongoURI);

// Requiring Routes
var adminRoutes   = require('./routes/admin'),
    teacherRoutes = require('./routes/teachers'),
    studentRoutes = require('./routes/students');

// <==========================================================Passport-Config===========================================>
passport.use('teacherLocal', new LocalStrategy(
    function(username, password, done){
      Teacher.getUserByUsername(username, function(err, teacher){
          if(err) throw err;
          if(!teacher){
              return done (null, false, {message: "Username is not registered"});
          }
          Teacher.comparePassword(password, teacher.password, function(err, isMatch){
            if(err) throw err;
            if(isMatch){
                return done(null, teacher);
            } else {
                return done(null, false, {message: "Incorrect Password"});
            }
          });
      })
}));

passport.use('studentLocal',new LocalStrategy(
    function(username, password, done){
      Student.getUserByUsername(username, function(err, student){
          if(err) throw err;
          if(!student){
              return done (null, false, {message: "Username is not registered"});
          }
          Student.comparePassword(password, student.password, function(err, isMatch){
            if(err) throw err;
            if(isMatch){
                return done(null, student);
            } else {
                return done(null, false, {message: "Incorrect Password"});
            }
          });
      })
}));


passport.serializeUser(function(user, done) {
    var key = {
      id: user.id,
      type: user.designation
    }
    done(null, key);
});

passport.deserializeUser(function(key, done) {
    // this could be more complex with a switch or if statements
    var Model = key.type === 'Teacher' ? Teacher : Student; 
    Model.findOne({
      _id: key.id
    }, '-salt -password', function(err, user) {
      done(err, user);
    });
});

app.use(function(req, res, next){
    res.locals.currentUser = req.user || null;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// ======================================= Routes ============================================================ //
app.get('/', (req, res) => 
res.render('landing'));

app.get('/index', (req, res) => 
res.render('index'));

app.use(adminRoutes);
app.use(teacherRoutes);
app.use(studentRoutes);

// ======================================== Server ============================================================ //
app.listen(PORT, () => console.log('Server started'));