/*
 *    Things needed for account creation - un used username & a password!
 *    Only one admin
 *    admin can generate voting polls for any type of competition
 *
 */

// Dev plan :: Creators / Editors ----> Getters / Readers

const express = require('express')
const mongoose = require('mongoose')
var ObjectId = require('mongoose').Types.ObjectId; 
const bodyparser = require('body-parser')
const jwt = require('jsonwebtoken')
const dbModels = require('./db_models')
const bcrypt = require('bcrypt')
const path = require('path');
// const { on } = require('events');
const app = express()

app.use(bodyparser.json())
app.use(express.static('./server/ui'));

const port = 3000
// Mongo DB
mongo_url = 'mongodb+srv://yushpbh:admingunpayswell@basedb.gznmi18.mongodb.net/test'
const DB = mongoose.connect(mongo_url).then(()=>{
    console.log("Connected to the DB")
}).catch((err)=>{
    console.log("Error in connection : "+err)
})

// MIDDLEWARE FUNCTIONS
const verify_token = function(req, res, next){
    //validate the token and then put the id in req.id

    let token = req.headers['x-access-token']
    if(!token){
        res.status(403).json({message:"No token provided"})
    }
    else{
        jwt.verify(token, "dumb-secret", (err, decode)=>{
            if(err){
                res.status(403).json({message:"Token Not Verified"})
            }
            else{
                req.userId = decode.id;
                next()
            }
        })
    }
}

// PAGE ROUTES
app.get('/', (req, res) => res.send('Hello World!'))
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'ui/login.html')))
app.get('/homepage', (req, res) => res.sendFile(path.join(__dirname, 'ui/homepage.html')))
app.get('/vote', (req, res) => res.sendFile(path.join(__dirname, 'ui/entry.html')))

app.post('/login-api', (req,res)=> {
    const {username, password} = req.body
    if(!username || !password){
        res.status(500).json({msg:"Empty Values!"})
    }
    else{
        // Search for the username in the database
        dbModels.USER.findOne({username: username}).then((status)=>{
            if(status){
                // Found
                bcrypt.compare(password, status.password_hash, function(err, result) {
                    if(result){
                        // Mathced !
                        console.log("Passcode Matched")
                        // Sign a JWT token!
                        payload = status['id'].toString()
                        var token = jwt.sign({ id: payload }, "dumb-secret", {
                            expiresIn: 86400 // 24 hours
                        });
                        console.log(`[i] login request for ${status.fullname} : PASS`)
                        res.status(200).json({token : token})
                    }
                    else{
                        console.log(`[i] login request for ${status.fullname} : FAIL`)
                        res.status(500).json({msg:"Username/Passcode invalid"})
                    }
                })
            }
            else{
                // Not Found
                res.status(500).json({msg:"Username/Passcode invalid"})
                console.log(`[i] login request for ${status.fullname} : FAIL`)
            }
        })
    }
    // res.status(200).send()
})
app.post('/register-api', (req,res)=> {
    const {username, password,fullname, dob, gender} = req.body
    if(!username || !password || !dob || !fullname || !gender){
        // If any of the fields are empty
        res.status(500).json({msg: "Empty values!"})
    }
    else{
        console.log(`[i] proceesing new user query for ${req.body.username} (${req.body.fullname}) `)
        // Check if the username is used or not!
        try {
            dbModels.USER.findOne({username: username}).then((status)=>{
                if(status){
                    // Found username
                    res.status(500).json({msg:"username already used!"})
                }
                else{
                    // Not Found Continue Account Creation
                    // Encrypting the hash! salrounds = 10
                    bcrypt.hash(password, 10, function(err, hash) {
                        // Store hash in your password DB.
                        password_hash = hash;
                        votings = []
                        newUserData = {username, password_hash, fullname, gender, votings }
                        const new_user = new dbModels.USER(newUserData)
                        
                        
                        new_user.save().then((ee)=>{
                            res.json({message:"User Created Succesfully! You May Login now!"})
                        })
                    })
                }
            })
        } catch (err) {
            res.status(500).send()
        }
    }
    // Requirements 
    // 1. Un-used username
    // 2. Password
    // 3. DOB
    // 4. Gender
})

// API GETTERS
app.post('/getPolls', (req,res)=> {
    // Send poll list
    dbModels.POLL.find().then((s)=>{
        
        res.status(200).json(s)
    })
})

app.post('/getUserInfo', verify_token, (req,res)=> {
    var query = { _id: new ObjectId(req.userId) };
    dbModels.USER.findOne(query)
    .then((stat)=>{
        if(stat){
            res.status(200).json(stat)
        }
        else{
            res.status(500).json(stat)
        }
    })
})
app.post('/getPollInfo', (req,res)=> {
    const { poll_id } = req.body
    if(!poll_id){
        res.status(500).send()
    }
    else{
        dbModels.POLL.findOne({_id : poll_id})
        .then((_result)=>{
            res.status(200).json(_result)
            // console.log(_result)
        })
        .catch((e)=>res.status(500).json({msg:"Not Found : "+e}))
        // res.status(200).send()
    }
})

// API SETTERS
app.post('/vote-api', (req,res)=> {
    // Input :: poll_id, choice
    // Method :: check if the user has not already voted!
    // Check users ID in alpha & beta users list.
    // If not present then allow to vote
    const {poll_id, poll_choice} = req.body
    if(!poll_id || !poll_choice){
        res.status(500).send()
    }
    else{
        dbModels.POLL.findOne({_id : poll_id})
        .then((stat)=>{
            stat.voting_accounts_alpha.forEach(acc => {
                if(acc == req.userId){
                    res.status(500).json({msg:"Already Voted!"})
                }
                else{
                    stat.voting_accounts_beta.forEach(aacc => {
                        if(aacc == req.userId){
                            res.status(500).json({msg:"Already Voted!"})
                        }
                        else{
                            // Now Account the vote!
                            // increase total_votings
                            // add userId to accounts.
                            dbModels.POLL.findOneAndUpdate(
                                { _id: poll_id },
                                { $inc : { 'total_votings' : 1 } }
                              )
                            console.log("Till Here")                            
                            if(poll_choice == 'alpha'){
                                dbModels.POLL.updateOne({_id: poll_id}, {$push : {voting_accounts_alpha : req.userId}}).then((resp)=>{if(resp){console.log("Added to list!")}})
                                .catch(err=>console.log(`Error in adding : ${err}`))
                            }
                            else{
                                dbModels.POLL.updateOne({_id: poll_id}, {$push : {voting_accounts_beta : req.userId}}).then((resp)=>{if(resp){console.log("Added to list!")}})
                                .catch(err=>console.log(`Error in adding : ${err}`))
                            }
                            res.status(200).json({msg:"Success!"})
                        }
                    })
                }
            })
        })
        // res.status(200).send()
    }
})
app.post('/createEntry',verify_token, (req,res)=> {
    // Validate all the given data about the entry!
    const {entry_title, entry_desc, alpha_title,beta_title} = req.body

    if(!entry_title || !entry_desc  || !alpha_title || !beta_title){
        res.status(500).json({msg:"Ops"})
    }
    else{
        _d = {entry_title, entry_desc, created_on : Date.now(), alpha_title,beta_title,total_votings:0, voting_accounts_alpha:[], voting_accounts_beta:[],online_status:true}

        dbModels.POLL(_d).save()
        .then((_result)=>{
            res.status(200).json({msg:"Successfully Entry created!"})
        })
        .catch((e)=>{res.status(500).json(e)})
    }
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
