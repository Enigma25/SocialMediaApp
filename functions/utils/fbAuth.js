const { admin, db } = require('./admin');

// Middleware
module.exports = (req, res, next) => { 
    let idToken ;
     if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) { 
        idToken = req.headers.authorization.split('Bearer ')[1];

     } else { 
         console.error('No token found');
         return res.status(403).json({error : 'Unauthorized'});
     } 

     // now at this stage we're sure of having an idTOKEN, 
     // To ensure that this idToken is from our app, do the following

     admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            // now the decoded token is going to have token data of our users
            // as well, so we attach it to our req object to then proceed ahead
            // with the respective post route that invokes this FBAuth()
            req.user = decodedToken;
            console.log(decodedToken);
            // get the user handle too, which is stored in our DB
            return db.collection('users')
                .where('userID', '==', req.user.uid) 
                .limit(1)
                .get();
        })
        .then(data => { 
            req.user.handle = data.docs[0].data().handle;
            return next();
        })
        .catch(err => {
            console.error('Error while verifying token: ', err);
            return res.status(403).json(err);
        });
}