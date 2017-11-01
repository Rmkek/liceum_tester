const express = require("express");
const session = require("express-session")
const fs = require("fs");
const MongoClient = require("mongodb").MongoClient;
const MongoStore = require("connect-mongo")(session)

const sha1 = require("sha1")
const secureRandom = require("secure-random")
const base64 = require("base-64")

const app = express();

const MONGO_URL = "mongodb://localhost:27017/liceum_db";
const MONGO_USERS_COLLECTION = "users";

const AUTH_CONSTS = {
  EMAIL_ALREADY_IN_DB: 'EMAIL_ALREADY_IN_DB',
  WRONG_EMAIL: 'WRONG_EMAIL',
  CANT_INSERT_USER_IN_COLLECTION: 'CANT_INSERT_USER_IN_COLLECTION',
  USER_ADDED_IN_DB: 'USER_ADDED_IN_DB',
  CORRECT_PASSWORD: 'CORRECT_PASSWORD',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  USER_IS_NOT_REGISTERED: 'USER_IS_NOT_REGISTERED',
  NOT_LOGGED_IN: 'NOT_LOGGED_IN'
}

app.set("port", process.env.PORT || 3001);

app.use(session({
  secret: 'asdgjkaj32423KLASKH45%#^&lmaAoA1338',
  cookie: { maxAge: 60000, httpOnly: false },
  store: new MongoStore({ url: 'mongodb://localhost/session_db' }),
  saveUninitialized: true,
  resave: true  
}))

// Express only serves static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.get('/api/register', (req, res) => {
  req.query.email = base64.decode(req.query.email).toLowerCase()
  req.query.pass = base64.decode(req.query.pass)

  let salt = saltArrayIntoString(secureRandom.randomArray(10))
  if (!validateEmail(req.query.email)) {
    res.status(400)
    res.json({error: AUTH_CONSTS.WRONG_EMAIL})
    return
  }

  searchEmailInCollection(req.query.email, (result) => {
    if (result.length > 0) {
      res.status(400)
      res.json({error: AUTH_CONSTS.EMAIL_ALREADY_IN_DB})
      return
    } else {
      let user = {
          email: req.query.email,
          pass: sha1(salt + req.query.pass),
          salt: salt,
          isApproved: false
      }

      addUserIntoCollection(user, (result) => {
        if (result == 1) {
          res.status(200);
          res.json({success: AUTH_CONSTS.USER_ADDED_IN_DB})
        } else {
          res.status(400);
          res.json({error: AUTH_CONSTS.CANT_INSERT_USER_IN_COLLECTION})
        }
      })
    }
  })
})

//TODO rework
app.get('/api/checkForLogin', (req, res) => {
  console.log('Got request on api/checkForLogin', req.session)
  if (req.session.isLoggedIn !== undefined && req.session.isLoggedIn) {
    res.status(200);
    res.json({success: AUTH_CONSTS.CORRECT_PASSWORD})
    return
  } else {
    res.status(200);
    res.json({success: AUTH_CONSTS.NOT_LOGGED_IN})
  }
})

app.get('/api/auth', (req, res) => {
  req.query.email = base64.decode(req.query.email).toLowerCase()

  pass = base64.decode(req.query.pass)

  searchEmailInCollection(req.query.email, (result) => {
    if (result.length > 0) {
        pass_hash = result[0].pass
        pass_salt = result[0].salt

        if (sha1(pass_salt + pass) == pass_hash) {
          res.session = req.session
          res.session.isLoggedIn = true
          res.status(200);
          res.json({success: AUTH_CONSTS.CORRECT_PASSWORD})
        } else {
          res.status(400);
          res.json({error: AUTH_CONSTS.WRONG_PASSWORD});
        }
    } else {
      res.status(400)
      res.json({error: AUTH_CONSTS.USER_IS_NOT_REGISTERED})
    }
  })
})

app.get('/admin', (req, res) => {
})

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
app.disable('etag')

const addUserIntoCollection = (user, cb) => {
  MongoClient.connect(MONGO_URL, (err, db) => {
    if (err) throw err;
    db.collection(MONGO_USERS_COLLECTION).insertOne(user, (err, res) => {
      if (err) throw err;
      console.log(`User: ${JSON.stringify(user)} inserted in database.`)
      cb(res.result.ok);
      db.close();
    });
  }) 
}

const validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

const saltArrayIntoString = (array) => {
  let str = ''
  array.forEach((e) => {
    str = str.concat(e)
  }, this);
  return str;
}

const searchEmailInCollection = (email, cb) => {
  MongoClient.connect(MONGO_URL, (err, db) => {
    if (err) throw err;
    db.collection(MONGO_USERS_COLLECTION).find({email:email}).toArray((err, result) => {
      if (err) throw err;
      db.close();
      cb(result)
    });
  });
}