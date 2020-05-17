const functions = require('firebase-functions');
const express = require('express');
const app = express();

const { getAllScreams, 
        postOneScream 
    } = require('./handlers/screams');
    
const {
     signup, 
     login, 
     uploadImage 
    } = require('./handlers/users');

const  FBAuth  = require('./utils/fbAuth');
const firebase = require('firebase');
const config = require('./utils/config');


// Screams routes
app.get('/screams', getAllScreams );
app.post('/screams', FBAuth, postOneScream);

// User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);


// https://baseurl.com/api/..
exports.api = functions.https.onRequest(app);


