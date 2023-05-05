//jshint esversion:6

//Importing the necesssary packages

require('dotenv').config();
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();

//
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set('view engine','ejs');

//Creating a DB for users on the mongoDB server
mongoose.connect("mongodb://localhost:27017/userdB",{ useNewUrlParser: true,useUnifiedTopology: true });

//Creating a schema for our user Data
const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

//Creating the schema model in DB
const User = mongoose.model("User",userSchema);

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

//POST method for register route
app.post("/register",function(req,res){

//Using the bcrypt methods for creating salt and hash
  bcrypt.genSalt(saltRounds, function(err, salt) {
      bcrypt.hash(req.body.password, salt, function(err, hash) {
          // Store hash in your password DB.
          //Using the data entered in the page and storing in the DB by creating a new user
           const newUser = new User({
             email: req.body.username,
             password: hash
           });

          //Saving the new user data in the DB and checking if there are any error while doing so
           newUser.save().then(function(){
             //Renders the secret.ejs file when the save is successful
             res.render("secrets");
           }).catch(function(err){
             //Renders the error when there is a failure
             res.render(err);
           });
      });
  });
});

//POST method for the login route
app.post("/login",function(req,res){

//Storing the data entered in variables
const email = req.body.username;
const password = req.body.password;

//Fetching the email ID from the DB and checing with the entered one
User.findOne({email:email}).then(function(foundUser){

//If the passwords match, then secrest.ejs files is rendered, else the error is rendered
//Using bycrypt menthod for comparing the password typed and the hashed password
bcrypt.compare(password, foundUser.password, function(err, result) {
  // result == true
  if(result){
  res.render("secrets");
  }
});

}).catch(function(err){
  res.render(err);
});
});

//Port/Local server where the web app is hosted on
app.listen(3000,function(){
  console.log("Listening to server on post 3000");
});
