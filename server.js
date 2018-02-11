const express = require("express");
const session = require("express-session");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
const MongoStore = require("connect-mongo")(session);

const sha1 = require("sha1");
const secureRandom = require("secure-random");
const base64 = require("base-64");

const bodyParser = require("body-parser");

const { execSync } = require("child_process");
const uuid = require("uuid/v4");

const app = express();

const ASSIGNMENT_CONSTANTS = require("./client/src/Backend_answers/AssignmentConstants");
const AUTH_CONSTANTS = require("./client/src/Backend_answers/AuthConstants");
const INFO_CONSTANTS = require("./client/src/Backend_answers/InfoConstants");
const APPROVE_USER_CONSTANTS = require("./client/src/Backend_answers/ApproveConstants");
const CODE_TESTING_CONSTANTS = require("./client/src/Backend_answers/CodeTestingConstants");

const MONGO_URL = "mongodb://localhost:27017/liceum_db";
const MONGO_DATABASE_NAME = "liceum_db";
const MONGO_USERS_COLLECTION = "users";

const CODE_SAVING_DIRECTORY = __dirname + "/testing_folder";
const ASSIGNMENTS_DIRECTORY = __dirname + "/Assignments";

let ASSIGNMENTS_CONFIGURATION = {};
fs.readFile(`${ASSIGNMENTS_DIRECTORY}/config.json`, "utf8", (err, contents) => {
  ASSIGNMENTS_CONFIGURATION = JSON.parse(contents);
});

app.set("port", process.env.PORT || 3001);

app.use(
  session({
    secret: "laseghasAHSFJAb3m253JlakLAOSL@*%T*#Y(Y@&AKnmxcoihaerarkjlppoixghdjli;o",
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

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  next();
});

// Express only serves static assets in production
// TODO: think about production and serving static files.
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

app.get("/assignments", (req, res) => {
  req.session.touch();
  res.next();
});

app.get("/api/assignments", (req, res) => {
  let answer = {
    assignments: []
  };

  ASSIGNMENTS_CONFIGURATION.assignmentPacks.forEach(e => {
    answer.assignments.push({
      category: e.category,
      name: e.name
    });
  });

  res.status(200);
  res.json(answer);
});

app.get("/api/getAssignmentPack", (req, res) => {
  let name = req.query.name;
  let nameIsFound = false;

  ASSIGNMENTS_CONFIGURATION.assignmentPacks.forEach(elem => {
    if (elem.name === name) {
      nameIsFound = true;
      let answer = { assignments: [] };

      fs.readFile(`${ASSIGNMENTS_DIRECTORY}${elem.tasks}`, "utf8", (err, contents) => {
        JSON.parse(contents).assignments.forEach(e => {
          answer.assignments.push({
            name: e.name
          });
        });

        MongoClient.connect(MONGO_URL, (err, db) => {
          if (err) throw err;
          const database = db.db(MONGO_DATABASE_NAME);

          database
            .collection(MONGO_USERS_COLLECTION)
            .find({ email: req.session.email })
            .toArray((err, result) => {
              if (err) throw err;

              if (result[0].finishedAssignments !== undefined) {
                for (let i = 0; i < answer.assignments.length; i++) {
                  let assignment = answer.assignments[i];

                  if (result[0].finishedAssignments[name] === undefined) {
                    res.status(200);
                    res.json(answer);
                    return true;
                  }

                  result[0].finishedAssignments[name].forEach(element => {
                    if (assignment.name === element) {
                      assignment["solved"] = true;
                    }
                  });
                }
                res.status(200);
                res.json(answer);
                return true;
              } else {
                res.status(200);
                res.json(answer);
                return true;
              }
            });
        });
      });
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
    } else {
      let user = {
        email: req.query.email,
        pass: sha1(salt + req.query.pass),
        salt: salt,
        isApproved: false,
        finishedAssignments: []
      };
      addUserIntoCollection(user, result => {
        if (result === 1) {
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
      let pass_hash = result[0].pass;
      let pass_salt = result[0].salt;
      if (!result[0].isApproved) {
        res.status(400);
        res.json({ error: AUTH_CONSTANTS.USER_IS_NOT_APPROVED });
        return;
      }

      if (sha1(pass_salt + pass) === pass_hash) {
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

    const database = db.db(MONGO_DATABASE_NAME);

    database
      .collection(MONGO_USERS_COLLECTION)
      .find(query)
      .toArray((err, result) => {
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
  });

  res.status(400);
});

app.post("/api/upload-code", (req, res) => {
  req.session.touch();
  let assignmentPack = req.query.assignmentPack;
  let assignment = req.query.assignment;

  if (!req.files) {
    res.status(400);
    res.json(CODE_TESTING_CONSTANTS.NO_FILES_UPLOADED);
    return;
  }

  let file = req.files.codeFile;
  let codeFileName = uuid();

  file.mv(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, function(err) {
    if (err) {
      fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
        if (err) console.log("Error happened when deleting code: ", err);
        console.log(`${codeFileName}.cpp was deleted`);
      });
      res.status(500);
      res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR);
      return;
    }

    for (let i = 0; i < ASSIGNMENTS_CONFIGURATION.assignmentPacks.length; i++) {
      let elem = ASSIGNMENTS_CONFIGURATION.assignmentPacks[i];

      if (elem.name === assignmentPack) {
        fs.readFile(`${ASSIGNMENTS_DIRECTORY}/${elem.tasks}`, "utf8", (err, contents) => {
          if (err) {
            fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
              if (err) console.log("Error happened when deleting code: ", err);
              console.log(`${codeFileName}.cpp was deleted`);
            });

            res.status(500);
            res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR);
            return;
          }

          let content = JSON.parse(contents).assignments;

          for (let j = 0; j < content.length; j++) {
            let e = content[j];

            if (e.name === assignment) {
              let tests = e.tests;

              for (let k = 0; k < tests.length; k++) {
                let test = tests[k];
                let input_test_file = `${ASSIGNMENTS_DIRECTORY}${elem.tests}${test}_in.txt`;
                let output_test_file = `${ASSIGNMENTS_DIRECTORY}${elem.tests}${test}_out.txt`;
                // TODO: parallelism
                let input = fs.readFileSync(input_test_file, "utf8");
                let expected_output = fs.readFileSync(output_test_file, "utf8");
                let output = execSync(
                  `cd ${CODE_SAVING_DIRECTORY} && g++ ${codeFileName}.cpp -o ${codeFileName}.out && ./${codeFileName}.out ${input}`,
                  "utf8"
                ).toString();

                if (output !== expected_output) {
                  console.log("stdout !== expected_output");

                  fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
                    if (err) console.log("Error happened when deleting code: ", err);
                    console.log(`${codeFileName}.cpp was deleted`);
                  });
                  fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.out`, err => {
                    if (err) console.log("Error happened when deleting binary: ", err);
                    console.log(`${codeFileName}.out was deleted`);
                  });

                  res.status(500);
                  res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR);
                  return;
                }
              }

              if (!res.headersSent) {
                fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
                  if (err) console.log("Error happened when deleting code: ", err);
                  console.log(`${codeFileName}.cpp was deleted`);
                });
                fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.out`, err => {
                  if (err) console.log("Error happened when deleting binary: ", err);
                  console.log(`${codeFileName}.out was deleted`);
                });

                console.log("session: ", req.session);

                updateFinishedAssignment(req.session.email, assignmentPack, assignment, result => {
                  console.log("added in db");
                });

                res.status(200);
                res.json(CODE_TESTING_CONSTANTS.TESTS_PASSED);
                return;
              }
            }
          }
        });
      }
    }
  });
});

app.get("/api/get-info", (req, res) => {
  searchEmailInCollection(req.session.email, result => {
    if (result[0].additional_info === undefined) {
      res.status(200);
      res.json({ success: INFO_CONSTANTS.INFO_NOT_ADDED });
    } else {
      res.status(200);
      res.json({ success: INFO_CONSTANTS.INFO_ADDED });
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

    const database = db.db(MONGO_DATABASE_NAME);
    database.collection(MONGO_USERS_COLLECTION).insertOne(user, (err, res) => {
      if (err) throw err;
      console.log(`User: ${JSON.stringify(user)} inserted in database.`);
      cb(res.result.ok);
      db.close();
    });
  });
};

const validateEmail = email => {
  var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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

    const database = db.db(MONGO_DATABASE_NAME);
    database
      .collection(MONGO_USERS_COLLECTION)
      .find({ email: email })
      .toArray((err, result) => {
        if (err) throw err;
        db.close();
        cb(result);
      });
  });
};

const updateFinishedAssignment = (email, assignmentPack, assignment, cb) => {
  console.log(assignmentPack);
  console.log("Email from req.session: ", email);
  MongoClient.connect(MONGO_URL, (err, db) => {
    if (err) throw err;

    const database = db.db(MONGO_DATABASE_NAME);
    database
      .collection(MONGO_USERS_COLLECTION)
      .find({ email: email })
      .toArray((err, result) => {
        if (err) throw err;

        if (result[0].finishedAssignments === undefined) {
          let obj = {};
          obj[assignmentPack] = new Array(assignment);

          let newValue = {
            $push: {
              finishedAssignments: obj
            }
          };

          database.collection(MONGO_USERS_COLLECTION).updateOne({ email: email }, newValue, (err, result) => {
            if (err) throw err;
            db.close();
            cb(result);
          });
        } else {
          // TODO: mongoose.
          let output = {};
          result[0].finishedAssignments[assignmentPack].forEach(e => {
            if (Object.keys(e)[0] === assignmentPack && !e[assignmentPack].includes(assignment)) {
              e[assignmentPack].push(assignment);
              output = e;
            }
          });

          let newValue = {
            $set: {
              finishedAssignments: output
            }
          };

          console.log(newValue.$set);
          if (Object.keys(newValue.$set.finishedAssignments).length === 0 && newValue.$set.finishedAssignments.constructor === Object) {
            // TODO: add an response if assignment is already added
            console.log("[DEBUG] Assignment already added in set.");
            db.close();
            return;
          }

          database.collection(MONGO_USERS_COLLECTION).updateOne({ email: email }, newValue, (err, result) => {
            if (err) throw err;

            db.close();
            cb(result);
          });
        }
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
    const database = db.db(MONGO_DATABASE_NAME);

    database.collection(MONGO_USERS_COLLECTION).updateOne(query, newValue, (err, result) => {
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
    const database = db.db(MONGO_DATABASE_NAME);

    database.collection(MONGO_USERS_COLLECTION).updateOne({ email: query }, newValue, (err, result) => {
      if (err) throw err;
      db.close();
      cb(result);
    });
  });
};
