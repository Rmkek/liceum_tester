const express = require("express");
const session = require("express-session");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
const MongoStore = require("connect-mongo")(session);

const sha1 = require("sha1");
const secureRandom = require("secure-random");
const base64 = require("base-64");

const app = express();

const ASSIGNMENT_CONSTANTS = require("./client/src/Backend_answers/AssignmentConstants");
const AUTH_CONSTANTS = require("./client/src/Backend_answers/AuthConstants");
const INFO_CONSTANTS = require("./client/src/Backend_answers/InfoConstants");
const APPROVE_USER_CONSTANTS = require("./client/src/Backend_answers/ApproveConstants");

const MONGO_URL = "mongodb://localhost:27017/liceum_db";
const MONGO_USERS_COLLECTION = "users";

let CONFIG_JSON_CONTENT = {};
fs.readFile("client/src/Assignments/config.json", "utf8", (err, contents) => {
    CONFIG_JSON_CONTENT = JSON.parse(contents);
});

app.set("port", process.env.PORT || 3001);

app.use(
    session({
        secret:
            "laseghasAHSFJAb3m253JlakLAOSL@*%T*#Y(Y@&AKnmxcoihaerarkjlppoixghdjli;o",
        cookie: {
            maxAge: 600000,
            httpOnly: false
        },
        store: new MongoStore({ url: "mongodb://localhost/session_db" }),
        resave: true,
        saveUninitialized: true
    })
);

app.use(fileUpload());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "POST, GET, PUT, DELETE, OPTIONS"
    );
    next();
});

// Express only serves static assets in production
// TODO: think about production and serving static files.
if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
}

app.get("/assignments", (req, res) => {
    req.session.touch();
});

app.get("/api/assignments", (req, res) => {
    fs.readFile(
        "client/src/Assignments/config.json",
        "utf8",
        (err, contents) => {
            CONFIG_JSON_CONTENT = JSON.parse(contents);
            res.status(200);
            res.json(CONFIG_JSON_CONTENT);
        }
    );
});

app.get("/api/getAssignmentPack", (req, res) => {
    let name = req.query.name;
    let nameIsFound = false;

    CONFIG_JSON_CONTENT.assignments.forEach(elem => {
        if (elem.name === name) {
            nameIsFound = true;

            let answer = {};
            fs.readFile(
                `client/src/Assignments/${elem.tasks}`,
                "utf8",
                (err, contents) => {
                    answer.tasks = JSON.parse(contents).tasks;
                    res.status(200);
                    res.json(answer);
                }
            );
        }
    });

    if (!nameIsFound) {
        res.status(400);
        res.json({ error: ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT });
    }
});

app.get("/api/register", (req, res) => {
    req.query.email = base64.decode(req.query.email).toLowerCase();
    req.query.pass = base64.decode(req.query.pass);

    let salt = saltArrayIntoString(secureRandom.randomArray(10));
    if (!validateEmail(req.query.email)) {
        res.status(400);
        res.json({ error: AUTH_CONSTANTS.WRONG_EMAIL });
        return;
    }

    searchEmailInCollection(req.query.email, result => {
        if (result.length > 0) {
            res.status(400);
            res.json({ error: AUTH_CONSTANTS.EMAIL_ALREADY_IN_DB });
            return;
        } else {
            let user = {
                email: req.query.email,
                pass: sha1(salt + req.query.pass),
                salt: salt,
                isApproved: false
            };
            addUserIntoCollection(user, result => {
                if (result == 1) {
                    res.status(200);
                    res.json({ success: AUTH_CONSTANTS.USER_ADDED_IN_DB });
                } else {
                    res.status(400);
                    res.json({
                        error: AUTH_CONSTANTS.CANT_INSERT_USER_IN_COLLECTION
                    });
                }
            });
        }
    });
});

app.get("/api/checkForLogin", (req, res) => {
    if (req.session !== undefined && req.session.isLoggedIn) {
        req.session.touch();
        res.status(200);
        res.json({ success: AUTH_CONSTANTS.CORRECT_PASSWORD });
        return;
    } else {
        req.session.isLoggedIn = false;
        res.status(200);
        res.json({ success: AUTH_CONSTANTS.NOT_LOGGED_IN });
    }
});

app.get("/api/approveUser", (req, res) => {
    //TODO: check for user being admin
    approveUser(req.query, result => {
        res.status(200);
        res.json({ success: APPROVE_USER_CONSTANTS.USER_APPROVED });
    });
});

app.get("/api/auth", (req, res) => {
    req.query.email = base64.decode(req.query.email).toLowerCase();
    let pass = base64.decode(req.query.pass);

    searchEmailInCollection(req.query.email, result => {
        if (result.length > 0) {
            console.log("Found users for authentification: ", result);
            pass_hash = result[0].pass;
            pass_salt = result[0].salt;
            if (!result[0].isApproved) {
                res.status(400);
                res.json({ error: AUTH_CONSTANTS.USER_IS_NOT_APPROVED });
                return;
            }

            if (sha1(pass_salt + pass) == pass_hash) {
                req.session.isLoggedIn = true;
                req.session.email = req.query.email;
                res.status(200);
                res.json({ success: AUTH_CONSTANTS.CORRECT_PASSWORD });
            } else {
                res.status(400);
                res.json({ error: AUTH_CONSTANTS.WRONG_PASSWORD });
            }
        } else {
            res.status(400);
            res.json({ error: AUTH_CONSTANTS.USER_IS_NOT_REGISTERED });
        }
    });
});

/*app.get('/admin', (req, res) => {
    //TODO check if user is admin
    //Search in database and check if user is admin. Maybe do it in /api/auth and just check cookie for being admin.

}) */

app.get("/api/getNotApprovedUsers", (req, res) => {
    // Search in database and return users who have not been accepted.
    // TODO check for user being admin
    console.log("Got request on api/getNotApprovedUsers");
    MongoClient.connect(MONGO_URL, function(err, db) {
        if (err) throw err;
        let query = {
            isApproved: false
        };
        db
            .collection(MONGO_USERS_COLLECTION)
            .find(query)
            .toArray(function(err, result) {
                if (err) throw err;

                res.status(200);
                res.json({ success: result });
                db.close();
            });
    });
});

app.get("/api/add-info", (req, res) => {
    //TODO check add-info for user having session. If there is no session, redirect to login page.

    let name = req.query.name;
    let grade = req.query.grade;
    let letter = req.query.letter;

    addInfo(req.session.email, name, grade, letter, result => {
        res.status(200);
        res.json({ success: result.result.ok });
        return;
    });

    res.status(400);
});

app.post("/api/upload-code", (req, res) => {
    // Get what user this file is coming from and what task it is supposed to solve
    if (!req.files) {
        return res.status(403).send("No files were uploaded.");
    }

    let file = req.files.codeFile;

    file.mv("/home/rmk/Desktop/liceum_tester/testing_folder/file.cpp", function(
        err
    ) {
        res.status(200).send("File uploaded!");
    });
});

app.get("/api/get-info", (req, res) => {
    searchEmailInCollection(req.session.email, result => {
        if (result[0].additional_info === undefined) {
            res.status(400);
            res.json({ success: GET_INFO_CONSTS.INFO_NOT_ADDED });
        } else {
            res.status(200);
            res.json({ success: GET_INFO_CONSTS.INFO_ADDED });
        }
    });
});

app.listen(app.get("port"), () => {
    console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
app.disable("etag");

const addUserIntoCollection = (user, cb) => {
    MongoClient.connect(MONGO_URL, (err, db) => {
        if (err) throw err;
        db.collection(MONGO_USERS_COLLECTION).insertOne(user, (err, res) => {
            if (err) throw err;
            console.log(`User: ${JSON.stringify(user)} inserted in database.`);
            cb(res.result.ok);
            db.close();
        });
    });
};

const validateEmail = email => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

const saltArrayIntoString = array => {
    let str = "";
    array.forEach(e => {
        str = str.concat(e);
    }, this);
    return str;
};

const searchEmailInCollection = (email, cb) => {
    MongoClient.connect(MONGO_URL, (err, db) => {
        if (err) throw err;
        db
            .collection(MONGO_USERS_COLLECTION)
            .find({ email: email })
            .toArray((err, result) => {
                if (err) throw err;
                db.close();
                cb(result);
            });
    });
};

const approveUser = (query, cb) => {
    MongoClient.connect(MONGO_URL, (err, db) => {
        if (err) throw err;
        let newValue = {
            $set: {
                isApproved: true
            }
        };
        db
            .collection(MONGO_USERS_COLLECTION)
            .updateOne(query, newValue, (err, result) => {
                if (err) throw err;
                db.close();
                cb(result);
            });
    });
};

const addInfo = (query, name, grade, letter, cb) => {
    MongoClient.connect(MONGO_URL, (err, db) => {
        if (err) throw err;
        let newValue = {
            $set: {
                additional_info: {
                    name: name,
                    grade: grade,
                    letter: letter
                }
            }
        };
        db
            .collection(MONGO_USERS_COLLECTION)
            .updateOne({ email: query }, newValue, (err, result) => {
                if (err) throw err;
                db.close();
                cb(result);
            });
    });
};
