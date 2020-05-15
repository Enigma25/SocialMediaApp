const { admin, db } = require('../utils/admin');
const config  = require('../utils/config');
const firebase = require('firebase');
firebase.initializeApp(config);

// utility functions
const isEmptyString = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(emailRegEx)) { 
        return true;
    } else  return false;
}


exports.signup =  (req,res) => {
    let errors = {};
    const newUser = {
        email : req.body.email,
        password : req.body.password,
        confirmPassword : req.body.confirmPassword,
        userHandle : req.body.userHandle
    };
    //  validating signup data    
    if(isEmptyString(newUser.email)) { 
        errors.email = "Must not be empty";
    } else if(!isEmail(newUser.email) ){
        errors.email = "Must be a valid email-id";
    }

    if(isEmptyString(newUser.password)) { 
        errors.password = "Pas sword must not be empty";
    } 
    
    if(newUser.password !== newUser.confirmPassword) { 
        errors.confirmPassword = "Password doesn't match";
    }

    if(isEmptyString(newUser.userHandle)) { 
        errors.userHandle = "User handle must not be empty";
    } 

    if(Object.keys(errors).length > 0) { 
        return res.status(400).json({errors});
    }

    const noImg = 'no-img.png';

    // validation of user data finished

    let token, userID;
    db.doc(`/users/${newUser.userHandle}`).get()
        .then(doc => {
            if(doc.exists) { 
                return res.status(400).json({handle : 'this handle is already taken'})
            }
            else { 
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then(data => {
            userID = data.user.uid;
            return data.user.getIdToken();
        }) 
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle : newUser.userHandle,
                email : newUser.email,
                createdAt : new Date().toISOString(),
                userID : userID, // be careful your userID is his userId
                imageUrl : `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`
            };
            return db.doc(`/users/${newUser.userHandle}`).set(userCredentials);
        })
        .then(()=> {
            return res.status(201).json({token : token} );
        })
        .catch(err => {
            if(err.code ==='auth/email-already in use') {
                return res.status(400).json({email: 'Email already in use'});
            } else { 
                return res.status(500).json({error : err.code});
            }
        });
}

exports.login = (req,res) => {
    const user = {
        email : req.body.email,
        password : req.body.password
    };
    let errors = {};
    
    if(isEmptyString(user.email)) errors.email = "Must not be empty";
    if(isEmptyString(user.password)) errors.password = "Must not be empty";

    if(Object.keys(errors).length > 0)
        return res.status(400).json(errors);
   
    firebase.auth().signInWithEmailAndPassword(user.email,user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => { 
            return res.json({token});
        })
        .catch(err => {
            console.error(err);
            if(err.code === "auth/wrong-password") {
                 return res.status(403).json({general: "Wrong credentials please try"});
            } else {
                return res.status(500).json({error : err.code});
            }
            });
}


exports.uploadImage = (req, res) => {
    // to upload image 
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');


    const busboy = new BusBoy({headers : req.headers});
    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => { 
        //eg: my.file.png
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);
         

        const imageExtension = filename.split('.')[filename.split('.').length-1];
        const imageFileName = `${Math.round(Math.random()*1000000000)}.${imageExtension}`;

        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};
        
        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => { 
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable : false,
            metadata = {
                metadata : {
                    contentType : imageToBeUploaded.mimetype 
                }
            }
        })
        .then(() => { 
            // construct the image url to add it to the user
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            // now add this url to the user document in the firebase database
            return db.doc(`/users/${req.user.handle}`).update({imageUrl});
        })
        .then(()=>  {
            return res.json({message : 'Image Uploaded Sucessully!'});
        })
        .catch(err => {
             console.error(err);
             return res.status(500).json({Error:err.code });
        });
    });


}