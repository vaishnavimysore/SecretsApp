//jshint esversion:6

//Importing the necesssary packages

require('dotenv').config();
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const SHA256 = require("crypto-js/sha256");
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

// Using the mongoose encryption plugin to encrypt our Password. For this we define a secretCode which
// has to be given to the secret attribute in the plugin and also mention which fields have to be
// encrypted to avoid getting all the attributes encrypted. This step has to be done before the db model is created

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

//Using the data entered in the page and storing in the DB by creating a new user
 const newUser = new User({
   email: req.body.username,
   password: SHA256(req.body.password).toString()
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

//POST method for the login route
app.post("/login",function(req,res){

//Storing the data entered in variables
const email = req.body.username;
const password = SHA256(req.body.password).toString();

//Fetching the email ID from the DB and checing with the entered one
User.findOne({email:email}).then(function(foundUser){

//IF the emails match, then secrest.ejs files is rendered, else the error is rendered
  if (foundUser.password === password) {
    res.render("secrets");
  }
}).catch(function(err){
  res.render(err);
});
});

//Port/Local server where the web app is hosted on
app.listen(3000,function(){
  console.log("Listening to server on post 3000");
});
