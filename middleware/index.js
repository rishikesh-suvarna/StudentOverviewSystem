var adminStaus = false;
var middlewareObj = {}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated() && req.user.designation === "Teacher"){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/teachers/login");
}

middlewareObj.adminLogin = function(req, res, next){
    if(adminStaus){
        return next;
    }
    else {
        req.flash("error", "You need to be logged in");
        res.redirect('/admin/login');
    }
}

module.exports = middlewareObj;