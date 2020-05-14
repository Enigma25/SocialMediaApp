const { db } = require('../utils/admin');

exports.getAllScreams = (req,res) => {
    db.collection('screams')
        .orderBy('createdAt', 'desc').get()
        .then(data => {
            let screams = [];
            data.forEach(doc => { 
                screams.push({
                    screamID : doc.id,
                    body : doc.data().body,
                    userHandle : doc.data().userHandle,
                    createdAt : doc.data().createdAt,
                    commentCount : doc.data().commentCount,
                    likeCount : doc.data().likeCount
                });
            }); 
            return res.json(screams);
        })
        .catch(err =>{
            console.error(err);
            return res.status(500).json({error :err.code});
        });
}

exports.postOneScream = (req,res) => {
    if(req.body.body.trim() === '') { 
        return res.status(400).json({body: "Body Must not be empty"});
    }
    const newScream = {
        body : req.body.body,
        //userHandle : req.body.userHandle, now we have access to req.user details hence we directle consume it
        userHandle : req.user.handle,
        createdAt : new Date().toISOString()
    }
    db.collection('screams')
        .add(newScream)
        .then(doc => {
            res.json({ message: `Created sucessfully the scream with ID = ${doc.id}`});
        })
        .catch(err => {
            res.status(500).json({error :'something went wrong'});
            console.error(err);
        });
}

