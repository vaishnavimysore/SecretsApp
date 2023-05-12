//jshint esversion:6

//Importing the necesssary packages
require('dotenv').config();
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
//Importing session, passport and passport local mongoose packages for using sessions and authentication for our app
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
//passport-local need not be imported as this package with add it by itself as a plugin
//importing passport-google packages for login and authentication
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//Package to use the findOrCreate function in google and facebook strategies
const findOrCreate = require('mongoose-findorcreate');
//importing passport-facebook packages for login and authentication
const FacebookStrategy = require("passport-facebook");

//Creates the web application with expresss
const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set('view engine','ejs');

//Setting up and initializing session using express
app.use(session({
  secret: process.env.SECRET,
  resave: false,           //Used for saving the session even when its not modified
  saveUninitialized: false, //Any session which is created but not modified can be stored
  cookie: { secure: false }  //Securing the cookies in the session
}))

//Initializes passport on every route call
app.use(passport.initialize());
//Allows passport to use express-session
app.use(passport.session());

//Creating a DB for users on the mongoDB server
mongoose.connect("mongodb://localhost:27017/userdB",{ useNewUrlParser: true,useUnifiedTopology: true });

//Creating a schema for our user Data
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  facebookId:String
});

//Using passport local mongoose package to salt and hash passwords and save into DB
userSchema.plugin(passportLocalMongoose);
//Using findOrCreate functin of its package to use in strategies
userSchema.plugin(findOrCreate);
//Creating the schema model in DB
const User = mongoose.model("User",userSchema);


//Create strategy for storing our user data
passport.use(User.createStrategy());

//Allows passport to Create a cookie and add our user identifications data into it
//Common serialize function for all passport strategies
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

//Allows passport to Break the cookie and uses our user identifications data
//Common deserialize function for all passport strategies
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

//GOOGLE Strategy to Login
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    uerProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//FACEBOOK Strategy to Login
passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//GET request for home route
app.get("/",function(req,res){
  //Renders the home.ejs file
  res.render("home");
});

//GET request for login route
app.get("/login",function(req,res){
  //Renders the login.ejs file
  res.render("login");
});

//GET request fpr register route
app.get("/register",function(req,res){
  //Renders the register.ejs file
  res.render("register");
});

//Google Authentication
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

//Facebook Authentication
  app.get('/auth/facebook',
    passport.authenticate('facebook'));

  app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect secrets.
      res.redirect('/secrets');
    });

//GET request for secrets route
app.get("/secrets",function(req,res){
  // The below line was added so we can't display the "/secrets" page
  // after we logged out using the "back" button of the browser, which
  // would normally display the browser cache and thus expose the
  // "/secrets" page we want to protect. Code taken from this post.
  res.set(
    'Cache-Control',
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
  );
  //check if the user is already authenticated and render the secrets page
  if(req.isAuthenticated()){
    res.render('secrets');
  }
  else {
    res.redirect('/login');
  }
});

//GET request for logout page
app.get("/logout",function(req,res){
  //using the passport function to logout(which breaks the cookies data) and redirects to home page
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});


//POST method for register route
app.post("/register",function(req,res){
  //passportLocalMongoose method to register a user to our db
  User.register({username:req.body.username}, req.body.password, function(err, user) {
    if (err)
    {
      console.log(err);
      //Incase of an error while register, the user is redirected to the register route
      res.redirect('/register');
    }
    else{
      //When the user is successfully register, we authenticate the user using passport using local strategy and redirect to secrets route
      passport.authenticate("local")(req,res,function(){
        res.redirect('/secrets');
      });
    }
  });
});

//POST method for the login route which first authenticates(verifies the user against their credentials) the user and then logs the user in
app.post("/login",passport.authenticate("local",{failureRedirect:'/login'}),function(req,res){
  //Storing the data entered, in user object
  const user = new User({
    username:req.body.username,
    password : req.body.password

  });
  //Passport function to login the user with the "user" object details
  req.login(user,function(err){
    if (err) {
      console.log(err);
    }
    else {
      res.redirect('/secrets');
    }
  });
});

//Port/Local server where the web app is hosted on
app.listen(3000,function(){
  console.log("Listening to server on post 3000");
});
