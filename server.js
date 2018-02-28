const express = require("express");
const session = require("express-session");
const fs = require("fs");
const fileUpload = require("express-fileupload");

const MongoClient = require("mongodb").MongoClient; // remove
const MongoStore = require("connect-mongo")(session); // remove
const mongoose = require("mongoose");

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

const User = require("./models/User");
const AssignmentPacks = require("./models/AssignmentPacks");
const AssignmentTaskSchema = require("./models/schemas/AssignmentTask");

const assignmentTaskModel = mongoose.model("AssignmentTask", AssignmentTaskSchema);

const MONGO_DATABASE_NAME = "liceum_db";
const MONGO_USERS_COLLECTION = "users";

mongoose.connect(MONGO_URL);

// we're going to translate this into  mongoose
const CODE_SAVING_DIRECTORY = __dirname + "/testing_folder";
const ASSIGNMENTS_DIRECTORY = __dirname + "/Assignments";

const PDF_SAVING_DIRECTORY = __dirname + "/client/public/";

app.set("port", process.env.PORT || 3001);

app.use(
  session({
    secret: "laseghasAHSFJAb3m253JlakLAOSL@*%T*#Y(Y@&AKnmxcoihaerarkjlppoixghdjli;o",
    cookie: {
      maxAge: 600000,
      httpOnly: false
    },
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

app.post("/api/add-assignment", (req, res) => {
  console.log("Got request, body: ", req.body);

  let name = req.body.assignmentPackName;
  let categories = req.body.assignmentPackCategories.split(",");
  let pdfFile = req.files.pdfTasks;
  let tasks = req.body.assignmentNames;
  let tasksArray = [];

  let pdfFileURL = `${PDF_SAVING_DIRECTORY}/${uuid()}.pdf`;
  pdfFile.mv(pdfFileURL, err => {
    if (err) console.log("Error happened while saving pdf: ", err);
  });

  let arrLength = tasks instanceof Array ? tasks.length : 1;

  for (let i = 0; i < arrLength; i++) {
    let j = 0;
    let temp_tests = [];

    while (req.body[`test_input_${i + 1}-${j + 1}`] !== undefined) {
      let input_test = req.body[`test_input_${i + 1}-${j + 1}`];
      let output_test = req.body[`test_input_${i + 1}-${j + 1}`];
      temp_tests.push({ input: input_test, output: output_test });
      j++;
    }

    let test_output = new assignmentTaskModel({
      name: arrLength === 1 ? tasks : tasks[i],
      tests: temp_tests
    });

    tasksArray.push(test_output);
  }

  new AssignmentPacks({
    pdfPath: pdfFileURL,
    name,
    categories,
    tasks: tasksArray
  })
    .save()
    .then(success => {
      res.status(200);
      res.json(ASSIGNMENT_CONSTANTS.ASSIGNMENT_ADDED);
    })
    .catch(err => {
      res.status(400);
      res.json(ASSIGNMENT_CONSTANTS.ASSIGNMENT_NOT_ADDED);
    });

  // tests

  //   file.mv(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, function(err) {
  //     if (err) {
  //       fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
  //         if (err) console.log("Error happened when deleting code: ", err);
  //         console.log(`${codeFileName}.cpp was deleted`);
  //       });
  //       res.status(500);
  //       res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR);
  //       return;
  //     }

  // new AssignmentPacks({
  //   name: name,
  //   categories: categories,
  //   pdfPath: pdfPath,
  //   tasks: tasks
  // })
  //   .save()
  //   .then(success => {
  //     res.status(200);
  //     res.json(ASSIGNMENT_CONSTANTS.ASSIGNMENT_ADDED);
  //   })
  //   .catch(err => {
  //     res.status(400);
  //     res.json(ASSIGNMENT_CONSTANTS.ASSIGNMENT_NOT_ADDED);
  //   });
});

// rework
app.get("/api/assignments", (req, res) => {
  AssignmentPacks.find({})
    .exec()
    .then(found => {
      const output = [];

      found.forEach(element => {
        output.push({
          name: element.name,
          category: element.category
        });
      });
      res.status(200);
      res.json(output);
    })
    .catch(err => {
      console.log("Error happened at /api/assignments");
    });

  // let answer = {
  //   assignments: []
  // };

  // ASSIGNMENTS_CONFIGURATION.assignmentPacks.forEach(e => {
  //   answer.assignments.push({
  //     category: e.category,
  //     name: e.name
  //   });
  // });

  // res.status(200);
  // res.json(answer);
});

// // rework
// app.get("/api/getAssignmentPack", (req, res) => {
//   let name = req.query.name;
//   let nameIsFound = false;

//   ASSIGNMENTS_CONFIGURATION.assignmentPacks.forEach(elem => {
//     if (elem.name === name) {
//       nameIsFound = true;
//       let answer = { assignments: [] };

//       fs.readFile(`${ASSIGNMENTS_DIRECTORY}${elem.tasks}`, "utf8", (err, contents) => {
//         JSON.parse(contents).assignments.forEach(e => {
//           answer.assignments.push({
//             name: e.name
//           });
//         });

//         MongoClient.connect(MONGO_URL, (err, db) => {
//           if (err) throw err;
//           const database = db.db(MONGO_DATABASE_NAME);

//           database
//             .collection(MONGO_USERS_COLLECTION)
//             .find({ email: req.session.email })
//             .toArray((err, result) => {
//               if (err) throw err;
//               if (result[0] !== undefined && result[0].finishedAssignments !== undefined) {
//                 for (let i = 0; i < answer.assignments.length; i++) {
//                   let assignment = answer.assignments[i];

//                   if (result[0].finishedAssignments[name] === undefined) {
//                     res.status(200);
//                     res.json(answer);
//                     return true;
//                   }

//                   result[0].finishedAssignments[name].forEach(element => {
//                     if (assignment.name === element) {
//                       assignment["solved"] = true;
//                     }
//                   });
//                 }
//                 res.status(200);
//                 res.json(answer);
//                 return true;
//               } else {
//                 res.status(200);
//                 res.json(answer);
//                 return true;
//               }
//             });
//         });
//       });
//     }
//   });

//   if (!nameIsFound) {
//     res.status(404);
//     res.json({ error: ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT });
//   }
// });

app.get("/api/register", (req, res) => {
  req.query.email = base64.decode(req.query.email).toLowerCase();
  req.query.pass = base64.decode(req.query.pass);

  let salt = saltArrayIntoString(secureRandom.randomArray(10));

  if (!validateEmail(req.query.email)) {
    res.status(400);
    res.json(AUTH_CONSTANTS.WRONG_EMAIL);
    return;
  }

  User.findOne({ email: req.query.email })
    .exec()
    .then(found => {
      if (found !== null) {
        res.status(400);
        res.json(AUTH_CONSTANTS.EMAIL_ALREADY_IN_DB);
        return;
      } else {
        let pass = sha1(salt + req.query.pass);
        new User({
          email: req.query.email,
          password: pass,
          salt: salt,
          isApproved: false,
          isAdmin: false,
          created_at: Date.now()
        })
          .save()
          .then(success => {
            res.status(200);
            res.json(AUTH_CONSTANTS.USER_ADDED_IN_DB);
          })
          .catch(err => {
            res.status(400);
            res.json(AUTH_CONSTANTS.CANT_INSERT_USER_IN_COLLECTION);
          });
      }
    })
    .catch(err => {
      console.log("Error at /api/register. ", err);
      res.status(400);
      res.json(AUTH_CONSTANTS.SERVER_ERROR);
    });
});

app.get("/api/checkForLogin", (req, res) => {
  if (req.session !== undefined && req.session.isLoggedIn) {
    req.session.touch();
    res.status(200);
    res.json(AUTH_CONSTANTS.CORRECT_PASSWORD);
  } else {
    req.session.isLoggedIn = false;
    res.status(200);
    res.json(AUTH_CONSTANTS.NOT_LOGGED_IN);
  }
});

app.get("/api/approveUser", (req, res) => {
  // TODO: check for user being admin
  User.findOne({ email: req.query.email })
    .exec()
    .then(user => {
      user.isApproved = true;
      user
        .save()
        .then(success => {
          res.status(200);
          res.json({ success: APPROVE_USER_CONSTANTS.USER_APPROVED });
        })
        .catch(err => {
          res.status(400);
          res.json({ error: APPROVE_USER_CONSTANTS.USER_NOT_APPROVED });
        });
    })
    .catch(err => {
      console.log("Error at /api/approveUser", err);
      res.status(400);
      res.json({ error: APPROVE_USER_CONSTANTS.SERVER_ERROR });
    });
});

app.get("/api/auth", (req, res) => {
  req.query.email = base64.decode(req.query.email).toLowerCase();
  req.query.pass = base64.decode(req.query.pass);

  User.findOne({ email: req.query.email })
    .exec()
    .then(user => {
      if (user !== null) {
        if (user.isApproved) {
          console.log("Found user: ", user);
          if (sha1(user.salt + req.query.pass) === user.password) {
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
          res.json({ error: AUTH_CONSTANTS.USER_IS_NOT_APPROVED });
        }
      } else {
        res.status(400);
        res.json({ error: AUTH_CONSTANTS.USER_IS_NOT_REGISTERED });
      }
    })
    .catch(err => {
      console.log("Error at /api/auth", err);
      res.status(400);
      res.json({ error: AUTH_CONSTANTS.SERVER_ERROR });
    });
});

/*app.get('/admin', (req, res) => {
    //TODO check if user is admin
    //Search in database and check if user is admin. Maybe do it in /api/auth and just check cookie for being admin.

}) */

app.get("/api/getNotApprovedUsers", (req, res) => {
  // TODO check for user being admin
  console.log("Got request on api/getNotApprovedUsers");
  User.find({ isApproved: false })
    .exec()
    .then(found => {
      let answer = [];

      found.forEach(el => {
        answer.push(el.email);
      });

      res.status(200);
      res.json(answer);
    })
    .catch(err => {
      console.log("Error at /api/getNotApprovedUsers", err);
      res.status(400);
      res.json({ SERVER_ERROR: "SERVER_ERROR" });
    });
});

app.get("/api/add-info", (req, res) => {
  //TODO check add-info for user having session. If there is no session, redirect to login page.
  let name = req.query.name;
  let grade = req.query.grade;
  let letter = req.query.letter;

  let updateObject = {
    name,
    grade,
    letter
  };

  User.findOneAndUpdate({ email: req.session.email }, { $set: { additional_info: updateObject } }, { new: true }, (err, doc) => {
    if (err) {
      console.log("Error at /api/add-info when updating user", err);
      res.status(400);
      res.json(INFO_CONSTANTS.INFO_NOT_ADDED);
    }
    console.log("Updated user: ", doc);
    res.status(200);
    res.json(INFO_CONSTANTS.INFO_ADDED);
  });
});

// app.post("/api/upload-code", (req, res) => {
//   req.session.touch();
//   let assignmentPack = req.query.assignmentPack;
//   let assignment = req.query.assignment;

//   if (!req.files) {
//     res.status(400);
//     res.json(CODE_TESTING_CONSTANTS.NO_FILES_UPLOADED);
//     return;
//   }

//   let file = req.files.codeFile;
//   let codeFileName = uuid();

//   file.mv(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, function(err) {
//     if (err) {
//       fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
//         if (err) console.log("Error happened when deleting code: ", err);
//         console.log(`${codeFileName}.cpp was deleted`);
//       });
//       res.status(500);
//       res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR);
//       return;
//     }

//     for (let i = 0; i < ASSIGNMENTS_CONFIGURATION.assignmentPacks.length; i++) {
//       let elem = ASSIGNMENTS_CONFIGURATION.assignmentPacks[i];

//       if (elem.name === assignmentPack) {
//         fs.readFile(`${ASSIGNMENTS_DIRECTORY}/${elem.tasks}`, "utf8", (err, contents) => {
//           if (err) {
//             fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
//               if (err) console.log("Error happened when deleting code: ", err);
//               console.log(`${codeFileName}.cpp was deleted`);
//             });

//             res.status(500);
//             res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR);
//             return;
//           }

//           let content = JSON.parse(contents).assignments;

//           for (let j = 0; j < content.length; j++) {
//             let e = content[j];

//             if (e.name === assignment) {
//               let tests = e.tests;

//               for (let k = 0; k < tests.length; k++) {
//                 let test = tests[k];
//                 let input_test_file = `${ASSIGNMENTS_DIRECTORY}${elem.tests}${test}_in.txt`;
//                 let output_test_file = `${ASSIGNMENTS_DIRECTORY}${elem.tests}${test}_out.txt`;
//                 let input = fs.readFileSync(input_test_file, "utf8");
//                 let expected_output = fs.readFileSync(output_test_file, "utf8");
//                 let output = execSync(
//                   `cd ${CODE_SAVING_DIRECTORY} && g++ ${codeFileName}.cpp -o ${codeFileName}.out && ./${codeFileName}.out ${input}`,
//                   "utf8"
//                 ).toString();

//                 if (output !== expected_output) {
//                   console.log("stdout !== expected_output");

//                   fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
//                     if (err) console.log("Error happened when deleting code: ", err);
//                     console.log(`${codeFileName}.cpp was deleted`);
//                   });
//                   fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.out`, err => {
//                     if (err) console.log("Error happened when deleting binary: ", err);
//                     console.log(`${codeFileName}.out was deleted`);
//                   });

//                   res.status(500);
//                   CODE_TESTING_CONSTANTS.TESTS_FAILED.on_test = k + 1;
//                   res.json(CODE_TESTING_CONSTANTS.TESTS_FAILED);
//                   return;
//                 }
//               }

//               if (!res.headersSent) {
//                 fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
//                   if (err) console.log("Error happened when deleting code: ", err);
//                   console.log(`${codeFileName}.cpp was deleted`);
//                 });
//                 fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.out`, err => {
//                   if (err) console.log("Error happened when deleting binary: ", err);
//                   console.log(`${codeFileName}.out was deleted`);
//                 });

//                 console.log("session: ", req.session);

//                 updateFinishedAssignment(req.session.email, assignmentPack, assignment, result => {
//                   console.log("added in db");
//                 });

//                 res.status(200);
//                 res.json(CODE_TESTING_CONSTANTS.TESTS_PASSED);
//                 return;
//               }
//             }
//           }
//         });
//       }
//     }
//   });
// });

app.get("/api/get-info", (req, res) => {
  User.findOne({ email: req.session.email })
    .exec()
    .then(result => {
      console.log("In /api/get-info, result: ", result);
      if (result === null || result === undefined || result.additional_info.name === undefined) {
        res.status(400);
        res.json(INFO_CONSTANTS.INFO_NOT_ADDED);
      } else {
        res.status(200);
        res.json({ success: INFO_CONSTANTS.INFO_ADDED, name: result.additional_info.name });
      }
    })
    .catch(err => {
      console.log("Error happened at /api/get-info", err);
      res.status(400);
      res.json(INFO_CONSTANTS.SERVER_ERROR);
    });
});

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
app.disable("etag");

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

// const updateFinishedAssignment = (email, assignmentPack, assignment, cb) => {
//   console.log(assignmentPack);
//   console.log("Email from req.session: ", email);
//   MongoClient.connect(MONGO_URL, (err, db) => {
//     if (err) throw err;

//     const database = db.db(MONGO_DATABASE_NAME);
//     database
//       .collection(MONGO_USERS_COLLECTION)
//       .find({ email: email })
//       .toArray((err, result) => {
//         if (err) throw err;
//         console.log("finishedAssignments:", result[0].finishedAssignments);
//         if (result[0].finishedAssignments === undefined || result[0].finishedAssignments.length === 0) {
//           let obj = {};
//           obj[assignmentPack] = [assignment];

//           let newValue = {
//             $set: {
//               finishedAssignments: obj
//             }
//           };

//           database.collection(MONGO_USERS_COLLECTION).updateOne({ email: email }, newValue, (err, result) => {
//             if (err) throw err;
//             db.close();
//             cb(result);
//           });
//         } else {
//           let output = {};
//           if (!result[0].finishedAssignments[assignmentPack].includes(assignment)) {
//             output[assignmentPack] = [assignment, ...result[0].finishedAssignments[assignmentPack]];
//           }
//           console.log("out: ", output);

//           let newValue = {
//             $set: {
//               finishedAssignments: output
//             }
//           };

//           console.log(newValue.$set);
//           if (Object.keys(newValue.$set.finishedAssignments).length === 0 && newValue.$set.finishedAssignments.constructor === Object) {
//             // TODO: add an response if assignment is already added
//             console.log("[DEBUG] Assignment already added in set.");
//             db.close();
//             return;
//           }

//           database.collection(MONGO_USERS_COLLECTION).updateOne({ email: email }, newValue, (err, result) => {
//             if (err) throw err;

//             db.close();
//             cb(result);
//           });
//         }
//       });
//   });
// };
