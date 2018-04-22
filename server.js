const fetch = require('isomorphic-fetch') // used by dropbox api
// server must-haves
var compression = require('compression') // test var
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const uuid = require('uuid/v4')
const httpsRedirect = require('express-http-to-https')

// working with file-system and saving user code
const fs = require('fs')
const fileUpload = require('express-fileupload')

// authentification and registration
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const checkLoginMiddleware = require('./checkLoginMiddleware')

// dropbox integration
const Dropbox = require('dropbox').Dropbox
const dbx = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN
})

// app managemenent
const opbeat = require('opbeat').start()

const app = express()

const ASSIGNMENT_CONSTANTS = require('./client/src/Backend_answers/AssignmentConstants')
const AUTH_CONSTANTS = require('./client/src/Backend_answers/AuthConstants')
const INFO_CONSTANTS = require('./client/src/Backend_answers/InfoConstants')
const APPROVE_USER_CONSTANTS = require('./client/src/Backend_answers/ApproveConstants')
const CODE_TESTING_CONSTANTS = require('./client/src/Backend_answers/CodeTestingConstants')

const User = require('./models/User')
const AssignmentPacks = require('./models/AssignmentPacks')
const AssignmentTaskSchema = require('./models/schemas/AssignmentTask')
const FinishedAssignmentPackSchema = require('./models/schemas/FinishedAssignmentPacks')

const FinishedAssignmentPack = mongoose.model('FinishedAssignmentPack', FinishedAssignmentPackSchema)
const AssignmentTaskModel = mongoose.model('AssignmentTask', AssignmentTaskSchema)

mongoose.connect(process.env.MONGODB_URI)

// remove me
const CODE_SAVING_DIRECTORY = path.resolve(__dirname, './testing_folder')
console.log('Resolved code saving directory: ', CODE_SAVING_DIRECTORY)

if (!fs.existsSync(CODE_SAVING_DIRECTORY)) {
  fs.mkdirSync(CODE_SAVING_DIRECTORY)
}

app.set('port', process.env.LOCAL_SERVER_PORT || process.env.PORT)
if (!process.env.LOCAL_SERVER_PORT) {
  app.use(opbeat.middleware.express())
}

app.use(compression())
app.use(httpsRedirect())

app.use(
  session({
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    }),
    secret: process.env.SESSION_SECRET_KEY,
    cookie: {
      maxAge: 30 * 60 * 1000,
      httpOnly: true
    },
    resave: false,
    saveUninitialized: false
  })
)
app.use(passport.initialize())
app.use(passport.session())

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'pass'
    },
    (email, password, done) => {
      User.findOne({
        email: email
      })
        .exec()
        .then(user => {
          if (!user) {
            return done(null, false)
          }

          if (!user.isApproved) {
            return done(null, {
              isApproved: false
            })
          }

          bcrypt.compare(password, user.password_hash, (err, isValid) => {
            if (err) return done(err)
            if (!isValid) return done(null, false)
            return done(null, user)
          })
        })
        .catch(err => {
          console.log('Error in pasport strategy', err)
          return done(err)
        })
    }
  )
)

passport.serializeUser((user, cb) => {
  console.log('serializing user: ', user)
  cb(null, user)
})

passport.deserializeUser((user, done) => {
  User.findById({
    _id: user._id
  })
    .exec()
    .then(user => {
      done(false, user)
    })
    .catch(err => {
      console.log('Error while deserializing: ', err)
      done(err)
    })
})

app.use(fileUpload())
app.use(bodyParser.json())

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'))
}

setInterval(() => {
  User
    .remove({isApproved: false})
    .exec()
    .then(removed => {
      console.log('REMOVED USERS: ', removed)
    })
    .catch(err => {
      console.log('ERROR WHEN REMOVING USERS: ', err)
    })
}, 1000 * 60 * 60 * 24) // every 24 hrs clear database

console.log('currentdir: ', __dirname)
console.log('resolved static path: ', path.resolve(__dirname, './client/build'))

app.use(express.static(path.resolve(__dirname, './client/build')))

app.post('/admin*', checkLoginMiddleware({ user: 'ADMIN' }), (req, res) => {
  res.status(200)
  res.json(AUTH_CONSTANTS.CORRECT_PASSWORD)
})
app.post('/teacher*', checkLoginMiddleware({user: 'TEACHER'}), (req, res) => {
  res.status(200)
  res.json(AUTH_CONSTANTS.CORRECT_PASSWORD)
})

app.post('/api/add-assignment', checkLoginMiddleware({ user: 'TEACHER' }), (req, res) => {
  console.log('Got request on /api/add-assignment, body: ', req.body)

  let name = req.body.assignmentPackName
  let category = req.body.category
  let pdfFile = req.files.pdfTasks
  let tasks = req.body.assignmentNames
  let tasksArray = []

  let pdfFileURL = `/${uuid()}.pdf`

  dbx
    .filesUpload({
      path: pdfFileURL,
      contents: pdfFile.data
    })
    .then(response => {
      const uploadedFilePath = response.path_display
      console.log('pdf is now on dropbox')
      dbx
        .sharingCreateSharedLink({
          path: uploadedFilePath,
          short_url: false
        })
        .then(data => {
          pdfFileURL = data.url
          console.log('PDF link created: ', pdfFileURL)
          let arrLength = tasks instanceof Array ? tasks.length : 1

          for (let i = 0; i < arrLength; i++) {
            let j = 0
            let tempTests = []

            while (req.body[`test_input_${i + 1}-${j + 1}`] !== undefined) {
              let inputTest = req.body[`test_input_${i + 1}-${j + 1}`]
              let outputTest = req.body[`test_input_${i + 1}-${j + 1}`]
              tempTests.push({
                input: inputTest,
                output: outputTest
              })
              j++
            }

            let testsOutput = new AssignmentTaskModel({
              name: arrLength === 1 ? tasks : tasks[i],
              tests: tempTests
            })

            tasksArray.push(testsOutput)
          }

          console.log('Ready to save in database!')
          console.log('pdf: ', pdfFileURL)
          console.log('name: ', name)
          console.log('category: ', category)
          console.log('tasks: ', tasksArray)
          new AssignmentPacks({
            pdfPath: pdfFileURL,
            name,
            category,
            tasks: tasksArray,
            teacher: req.user.email
          })
            .save()
            .then(success => {
              res.status(200)
              res.json(ASSIGNMENT_CONSTANTS.ASSIGNMENT_ADDED)
            })
            .catch(err => {
              console.log('Error happened at /api/add-assignments: ', err)
              res.status(400)
              res.json(ASSIGNMENT_CONSTANTS.ASSIGNMENT_NOT_ADDED)
            })
        })
        .catch(err => {
          res.status(400)
          res.json(ASSIGNMENT_CONSTANTS.ASSIGNMENT_NOT_ADDED)
          console.log('Exception happened when sharing assignment: ', err)
        })
    })
    .catch(err => {
      res.status(400)
      res.json(ASSIGNMENT_CONSTANTS.ASSIGNMENT_NOT_ADDED)
      console.log('Exception happened when uploading assignment to dropbox: ', err)
    })
})

app.post('/api/assignments', (req, res) => {
  console.log('in /api/assignments, body: ', req.body)
  if (req.user !== undefined) {
    if (req.user.isTeacher) {
      console.log('user isTeacher')
      AssignmentPacks.find({teacher: req.user.email, category: req.body.category})
        .exec()
        .then(found => {
          console.log(found)
          let output = []
          found.forEach(elem => {
            console.log('elemtasks: ', elem.tasks)
            output.push({
              category: req.body.category,
              pdfPath: elem.pdfPath,
              name: elem.name,
              tasks: elem.tasks
            })
          })
          console.log('output: ', output)
          res.status(200)
          res.json(output)
        })
        .catch(err => {
          console.log('Error happened at /api/assignments', err)
        })
    } else {
      console.log('user is not teacher')
      AssignmentPacks
        .where('category').in(req.user.categories)
        .where('teacher').equals(req.user.teacher)
        .exec()
        .then(found => {
          let answer = []
          let finishedAssignments = []

          // if user has some finished assignments
          if (!(req.user.assignments === [] || req.user.assignments.length === 0)) {
            req.user.assignments.forEach(e => {
              e.finishedAssignments.forEach(assignmentID => {
                finishedAssignments.push(assignmentID)
              })
            })
          }

          console.log('finishedASsignments: ', finishedAssignments)

          found.forEach(elem => {
            let tasks = []

            if (finishedAssignments.length === 0) {
              elem.tasks.forEach(task => {
                tasks.push({
                  name: task.name,
                  id: task._id,
                  solved: false
                })
              })
            } else {
              elem.tasks.forEach(task => {
                if (finishedAssignments.includes(`${task._id}`)) {
                  tasks.push({
                    name: task.name,
                    id: task._id,
                    solved: true
                  })
                } else {
                  tasks.push({
                    name: task.name,
                    id: task._id,
                    solved: false
                  })
                }
              })
            }

            answer.push({
              pdfPath: elem.pdfPath,
              name: elem.name,
              category: elem.category,
              tasks: tasks
            })
          })

          res.status(200)
          res.json(answer)
        })
    }
  } else {
    res.redirect('/')
  }
})

app.post('/api/register', (req, res) => {
  req.body.email = req.body.email.toLowerCase()
  console.log('request on registration, req.body: ', req.body)
  // if email is not valid throw error
  if (!validateEmail(req.body.email)) {
    res.status(400)
    res.json(AUTH_CONSTANTS.WRONG_EMAIL)
    return
  }

  User.findOne({
    email: req.body.email
  })
    .exec()
    .then(found => {
      // if user is already registered throw error
      if (found !== null) {
        res.status(400)
        res.json(AUTH_CONSTANTS.EMAIL_ALREADY_IN_DB)
      } else {
        bcrypt.hash(req.body.pass, parseInt(process.env.SALT_ROUNDS), (err, hash) => {
          if (err) {
            console.log('Error happened at /api/register: ', err)
            res.status(400)
            res.json(AUTH_CONSTANTS.CANT_INSERT_USER_IN_COLLECTION)
          } else {
            switch (req.body.type) {
              case 'TEACHER':
                console.log('request for teacher registration, req.body: ', req.body)
                new User({
                  email: req.body.email,
                  password_hash: hash,
                  isApproved: false,
                  isTeacher: true,
                  first_name: req.body.first_name,
                  last_name: req.body.last_name,
                  patronymic: req.body.patronymic,
                  school: req.body.school,
                  created_at: Date.now()
                })
                  .save()
                  .then(success => {
                    console.log('teacher successfully saved in db ', success)
                    res.redirect('/')
                  })
                  .catch(err => {
                    console.log('Error happened at /api/register as Teacher: ', err)
                    res.status(400)
                    res.json(AUTH_CONSTANTS.CANT_INSERT_USER_IN_COLLECTION)
                  })
                break
              default:
                console.log('request for default user registration, req.body: ', req.body)
                // get teacher email or throw exception
                let [lastName, firstName, patronymic] = req.body.teacher.split(' ')
                User.findOne({
                  first_name: firstName,
                  last_name: lastName,
                  patronymic: patronymic
                }).exec()
                  .then(teacher => {
                    if (teacher === null) {
                      res.status(500)
                      res.json(AUTH_CONSTANTS.NO_SUCH_TEACHER)
                    } else {
                      new User({
                        email: req.body.email,
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        patronymic: req.body.patronymic,
                        password_hash: hash,
                        isApproved: false,
                        isAdmin: false,
                        teacher: teacher.email,
                        created_at: Date.now()
                      })
                        .save()
                        .then(success => {
                          res.status(200)
                          res.json(AUTH_CONSTANTS.USER_ADDED_IN_DB)
                        })
                        .catch(err => {
                          console.log('Error happened at /api/register: ', err)
                          res.status(400)
                          res.json(AUTH_CONSTANTS.CANT_INSERT_USER_IN_COLLECTION)
                        })
                    }
                  })
            }
          }
        })
      }
    })
    .catch(err => {
      console.log('Error at /api/register. ', err)
      res.status(400)
      res.json(AUTH_CONSTANTS.SERVER_ERROR)
    })
})

app.post('/api/approveUser', (req, res) => {
  if (
    req.user !== undefined &&
    req.user.isTeacher !== undefined &&
    req.user.isAdmin !== undefined &&
    (req.user.isAdmin || req.user.isTeacher)
  ) {
    if (req.user.isTeacher) {
      console.log('approving users for teacher')
      console.log('teacher: ', req.user)
      User.findOne({
        email: req.body.email,
        teacher: req.user.email
      })
        .exec()
        .then(user => {
          console.log('found user: ', user)
          user.isApproved = true
          user
            .save()
            .then(success => {
              res.status(200)
              res.json({
                success: APPROVE_USER_CONSTANTS.USER_APPROVED
              })
            })
            .catch(err => {
              console.log('Error happened at /api/approveUser: ', err)
              res.status(400)
              res.json({
                error: APPROVE_USER_CONSTANTS.USER_NOT_APPROVED
              })
            })
        })
        .catch(err => {
          console.log('Error at /api/approveUser', err)
          res.status(400)
          res.json({
            error: APPROVE_USER_CONSTANTS.SERVER_ERROR
          })
        })
    } else {
      User.findOne({
        email: req.body.email
      })
        .exec()
        .then(user => {
          user.isApproved = true
          user
            .save()
            .then(success => {
              res.status(200)
              res.json({
                success: APPROVE_USER_CONSTANTS.USER_APPROVED
              })
            })
            .catch(err => {
              console.log('Error happened at /api/approveUser: ', err)
              res.status(400)
              res.json({
                error: APPROVE_USER_CONSTANTS.USER_NOT_APPROVED
              })
            })
        })
        .catch(err => {
          console.log('Error at /api/approveUser', err)
          res.status(400)
          res.json({
            error: APPROVE_USER_CONSTANTS.SERVER_ERROR
          })
        })
    }
  } else {
    res.redirect('/')
  }
})

app.post('/api/remove-user', checkLoginMiddleware({user: 'TEACHER'}), (req, res) => {
  User.findOneAndRemove({
    email: req.body.email
  })
    .exec()
    .then(result => {
      console.log('result: ', result)
      res.status(200)
      res.json(APPROVE_USER_CONSTANTS.USER_REMOVED)
    })
    .catch(err => {
      console.log('error happened when removing at /api/remove-user', err)
      res.status(500)
      res.json(APPROVE_USER_CONSTANTS.SERVER_ERROR)
    })
})

app.post('/api/auth', (req, res, next) => {
  req.body.email = req.body.email.toLowerCase()
  passport.authenticate('local', (err, user) => {
    console.log('user in /api/auth/', user)
    if (err) {
      console.log('Error at /api/auth', err)
      res.status(400)
      return res.json({
        error: AUTH_CONSTANTS.SERVER_ERROR
      })
    } else if (!user) {
      res.status(400)
      return res.json({
        error: AUTH_CONSTANTS.USER_IS_NOT_REGISTERED
      })
    } else if (!user.isApproved) {
      res.status(500)
      return res.json({
        error: AUTH_CONSTANTS.USER_IS_NOT_APPROVED
      })
    }
    req.logIn(user, err => {
      if (err) return next(err)
      console.log('Authenticated user isAdmin: ', user.isAdmin)
      if (user.isAdmin) {
        res.redirect('/admin')
      } else if (user.isTeacher) {
        res.redirect('/teacher')
      } else {
        res.redirect('/assignments')
      }
    })
  })(req, res, next)
})

app.post('/api/getNotApprovedUsers', checkLoginMiddleware({ user: 'TEACHER' }), (req, res) => {
  console.log('Got request on api/getNotApprovedUsers')
  User.find({
    isApproved: false,
    teacher: req.user.email
  })
    .exec()
    .then(found => {
      let answer = []
      console.log(found)
      found.forEach(el => {
        answer.push({email: el.email,
          full_name: `${el.last_name} ${el.first_name} ${el.patronymic}` })
      })

      res.status(200)
      res.json(answer)
    })
    .catch(err => {
      console.log('Error at /api/getNotApprovedUsers', err)
      res.status(400)
      res.json({
        SERVER_ERROR: 'SERVER_ERROR'
      })
    })
})

// TODO: find assignment by teacher
app.post('/api/upload-code', checkLoginMiddleware({}), (req, res, next) => {
  const assignmentPack = req.body.assignmentPackName
  const assignmentID = req.body.assignmentID

  console.log('pack: ', assignmentPack)
  console.log('id: ', assignmentID)

  if (!req.files) {
    res.status(400)
    res.json(CODE_TESTING_CONSTANTS.NO_FILES_UPLOADED)
    next()
  }

  if (!(req.files.codeFile.name.endsWith('.cpp') || req.file.codeFile.name.endsWith('.c'))) {
    res.status(400)
    res.json(CODE_TESTING_CONSTANTS.NO_FILES_UPLOADED)
    next()
  }

  console.log('req.files', req.files)
  console.log('req.body: ', req.body)
  const file = req.files.codeFile
  AssignmentPacks.findOne({
    'tasks._id': assignmentID
  }).then(found => {
    let task = null

    if (found === null) {
      res.status(500)
      res.json(ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT)
      next()
    }

    // TODO: FIXME (better document search implementation)
    for (let i = 0; i < found.tasks.length; i++) {
      if (found.tasks[i]._id.toString() === assignmentID) {
        task = found.tasks[i]
      }
    }

    if (!task) {
      res.status(500)
      res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR)
      next()
    }

    const fileData = file.data.toString('utf8')
    let fetches = []
    let testIter = 0

    task.tests.every(test => {
      let runningTest = fetch('https://wandbox.org/api/compile.json', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          'compiler': 'gcc-head',
          'code': fileData,
          'stdin': test.input
        })
      })

      fetches.push(runningTest)
    })

    let callBackTests = () => {
      ++testIter
      console.log('in cbTests, testIter: ', testIter)

      if (testIter === task.tests.length) {
        // if user has no finished assignments
        if (req.user.assignments === undefined || req.user.assignments === null || req.user.assignments.length === 0) {
          const finishedAssignments = new FinishedAssignmentPack({
            packName: assignmentPack,
            finishedAssignments: [assignmentID]
          })
          console.log('user had no finished assignments.')
          console.log('finished assignments now: ', [finishedAssignments])

          req.user.assignments = [finishedAssignments]
        } else {
          for (let i = 0; i < req.user.assignments.length; i++) {
            // if user already has that assignmentpack
            if (req.user.assignments[i].packName === assignmentPack) {
              // task has been solved already
              if (req.user.assignments[i].finishedAssignments.includes(assignmentID)) {
                res.status(400)
                res.status(CODE_TESTING_CONSTANTS.TESTS_ALREADY_PASSED)
                next()
              } else {
                req.user.assignments[i].finishedAssignments.push(assignmentID)
              }
            } else {
              const finishedAssignments = new FinishedAssignmentPack({
                packName: assignmentPack,
                finishedAssignments: [assignmentID]
              })

              req.user.assignments.push(finishedAssignments)
            }
            break
          }
        }
        User.findByIdAndUpdate(req.user._id, req.user, {
          new: true
        })
          .exec()
          .then(updatedUser => {
            res.status(200)
            res.json(CODE_TESTING_CONSTANTS.TESTS_PASSED)
          })
          .catch(err => {
            console.log('Error at /api/upload-code:', err)
            res.status(500)
            res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR)
          })
      }
    }

    Promise.all(fetches).then(values => {
      values.forEach(value => value
        .json()
        .then(output => {
          console.log('output: ', output.program_output)
          console.log('expected output: ', task.tests[testIter].output)
          console.log('output === expected: ', output.program_output === task.tests[testIter].output)

          if (output.program_output !== task.tests[testIter].output) {
            res.status(500)
            CODE_TESTING_CONSTANTS.TESTS_FAILED.on_test = testIter + 1
            res.json(CODE_TESTING_CONSTANTS.TESTS_FAILED)
            return next()
          } else {
            callBackTests()
          }
        }))
    })
  })
})

app.post('/api/getTeachersList', (req, res) => {
  User.find({
    isTeacher: true,
    isApproved: true
  })
    .exec()
    .then(found => {
      console.log('found teachers in list: ', found)
      let answer = []

      found.forEach(el => {
        answer.push(`${el.last_name} ${el.first_name} ${el.patronymic}`)
      })

      res.status(200)
      res.json(answer)
    })
    .catch(err => {
      console.log('Error at /api/getNotApprovedUsers', err)
      res.status(400)
      res.json({
        SERVER_ERROR: 'SERVER_ERROR'
      })
    })
})

app.post('/api/logout', (req, res) => {
  console.log('User logged out.')
  req.session.destroy(() =>
    res.redirect('/')
  )
})

app.post('/api/checkForLogin', (req, res) => {
  if (req.user === undefined) {
    res.status(200)
    res.json(AUTH_CONSTANTS.NOT_LOGGED_IN)
  } else if (req.user.isAdmin) {
    res.redirect('/admin')
  } else if (req.user.isTeacher) {
    console.log('redirecting to teacher')
    res.redirect('/teacher')
  } else if (req.user) {
    res.redirect('/assignments')
  }
})

app.post('/api/getNotApprovedTeachers', checkLoginMiddleware({ user: 'ADMIN' }), (req, res) => {
  User.find({
    isApproved: false,
    isTeacher: true
  })
    .exec()
    .then(found => {
      let answer = []

      found.forEach(el => {
        answer.push(el.email)
      })

      res.status(200)
      res.json(answer)
    })
    .catch(err => {
      console.log('Error at /api/getNotApprovedUsers', err)
      res.status(400)
      res.json({
        SERVER_ERROR: 'SERVER_ERROR'
      })
    })
})

app.post('/api/get-info', checkLoginMiddleware({}), (req, res) => {
  res.status(200)
  res.json({
    success: INFO_CONSTANTS.INFO_ADDED,
    name: `${req.user.last_name} ${req.user.first_name} ${req.user.patronymic}`,
    categories: req.user.categories
  })
})

app.post('/api/update-student-categories', checkLoginMiddleware({user: 'TEACHER'}), (req, res) => {
  console.log('req.body: ', req.body)
  User.findOneAndUpdate({isApproved: true, teacher: req.user.email, email: req.body.email}, {$set: {categories: req.body.categories}})
    .exec()
    .then(user => {
      console.log('user: ', user)
      res.status(200)
    })
    .catch(err => {
      console.log('err: ', err)
      res.status(500)
    })
})

app.post('/api/get-teacher-students', checkLoginMiddleware({user: 'TEACHER'}), (req, res) => {
  User.find({
    isApproved: true,
    teacher: req.user.email
  })
    .exec()
    .then(found => {
      let students = []
      if (found.length === 0) {
        res.status(200)
        res.json(students)
      } else {
        found.forEach(e => {
          students.push({full_name: `${e.last_name} ${e.first_name} ${e.patronymic}`,
            email: e.email,
            categories: e.categories })
        })
        res.status(200)
        res.json(students)
      }
    })
})

// add feature for saving the ids and thus not breaking the heck of ur users
app.post('/api/teacher-update-assignment', checkLoginMiddleware({user: 'TEACHER'}), (req, res) => {
  console.log('updating assignment...: ', req.body)
  console.log('updating tasks: ', req.body.assignmentNames)
  let assignmentName = req.body.assignmentName
  let name = req.body.assignmentPackName
  let category = req.body.category
  let pdfFile = req.files.pdfTasks
  let tasks = req.body.assignmentNames
  let tasksArray = []

  let pdfFileURL = `/${uuid()}.pdf`
  if (pdfFile !== undefined) {
    dbx
      .filesUpload({
        path: pdfFileURL,
        contents: pdfFile.data
      })
      .then(response => {
        const uploadedFilePath = response.path_display
        console.log('pdf is now on dropbox')
        dbx
          .sharingCreateSharedLink({
            path: uploadedFilePath,
            short_url: false
          })
          .then(data => {
            pdfFileURL = data.url
            console.log('PDF link created: ', pdfFileURL)

            // let arrLength = tasks instanceof Array ? tasks.length : 1

            console.log('got tasks: ', tasks)

            let testsArr = []
            console.log('Object.keys: ', Object.keys(req.body))
            Object.keys(req.body).forEach(str => {
              // check if arr already has it
              if (str.startsWith('input-')) {
                testsArr.push({
                  input: req.body[`input-${str.substring(6, str.length)}`],
                  output: req.body[`output-${str.substring(6, str.length)}`],
                  _id: mongoose.Types.ObjectId(str.substring(6, str.length))
                })
              }
            })

            console.log('got testsArr: ', testsArr)

            // for (let i = 0; i < arrLength; i++) {
            //   let j = 0
            //   let tempTests = []

            //   while (req.body[`test_input_${i + 1}-${j + 1}`] !== undefined) {
            //     let inputTest = req.body[`test_input_${i + 1}-${j + 1}`]
            //     let outputTest = req.body[`test_output_${i + 1}-${j + 1}`]
            //     tempTests.push({
            //       input: inputTest,
            //       output: outputTest
            //     })
            //     j++
            //   }

            let testsOutput = new AssignmentTaskModel({
              name: tasks,
              tests: testsArr
            })

            //   tasksArray.push(testsOutput)
            // }

            console.log('Ready to update database!')
            console.log('pdf: ', pdfFileURL)
            console.log('name: ', name)
            console.log('category: ', category)
            console.log('tasks: ', tasksArray)

            AssignmentPacks.findOne({
              teacher: req.user.email,
              name: assignmentName
            })
              .exec()
              .then(assignmentPack => {
                console.log('!!!found assignmentPack: ', assignmentPack)
                assignmentPack['pdfPath'] = pdfFileURL
                if (name !== undefined) {
                  assignmentPack['name'] = name
                }
                if (category !== undefined) {
                  assignmentPack['category'] = category
                }

                if (testsArr !== undefined && testsArr !== []) {
                  assignmentPack['tasks'] = [testsOutput]
                }
                assignmentPack.save(updatedPack => {
                  res.status(200)
                  res.json({success: true})
                })
              })
          })
      })
  }
  // } else {
  //   let arrLength = tasks instanceof Array ? tasks.length : 1

  //   for (let i = 0; i < arrLength; i++) {
  //     let j = 0
  //     let tempTests = []

  //     while (req.body[`test_input_${i + 1}-${j + 1}`] !== undefined) {
  //       let inputTest = req.body[`test_input_${i + 1}-${j + 1}`]
  //       let outputTest = req.body[`test_input_${i + 1}-${j + 1}`]
  //       tempTests.push({
  //         input: inputTest,
  //         output: outputTest
  //       })
  //       j++
  //     }

  //     let testsOutput = new AssignmentTaskModel({
  //       name: arrLength === 1 ? tasks : tasks[i],
  //       tests: tempTests
  //     })

  //     tasksArray.push(testsOutput)
  //   }

  //   console.log('Ready to update database!')
  //   console.log('name: ', name)
  //   console.log('category: ', category)
  //   console.log('tasks: ', tasksArray)

  //   AssignmentPacks.findOne({
  //     teacher: req.user.email,
  //     name: assignmentName
  //   })
  //     .exec()
  //     .then(assignmentPack => {
  //       console.log('!!!found assignmentPack: ', assignmentPack)
  //       if (name !== undefined) {
  //         assignmentPack['name'] = name
  //       }
  //       if (category !== undefined) {
  //         assignmentPack['category'] = category
  //       }

  //       if (tasksArray !== undefined && tasksArray !== []) {
  //         assignmentPack['tasks'] = tasksArray
  //       }
  //       assignmentPack.save(updatedPack => {
  //         res.status(200)
  //         res.json({success: true})
  //       })
  //     })
  // }
})
// })
// }
// })

app.post('/api/get-teacher-categories', checkLoginMiddleware({user: 'TEACHER'}), (req, res) => {
  AssignmentPacks.find({
    teacher: req.user.email
  })
    .exec()
    .then(found => {
      if (found !== null || found.length !== 0) {
        let categories = []
        found.forEach(e => {
          let inArray = false
          categories.forEach(elem => {
            if (elem.value === e.category) {
              inArray = true
            }
          })

          if (!inArray) {
            categories.push({label: e.category, value: e.category})
          }
        })
        res.status(200)
        res.json({categories})
      } else {
        res.status(200)
        res.json({categories: []})
      }
    })
})

app.post('/api/get-profile-data', checkLoginMiddleware({user: 'TEACHER'}), (req, res) => {
  let output = {}
  User.find({
    isApproved: false,
    teacher: req.user.email
  })
    .exec()
    .then(found => {
      if (found.length !== 0) {
        output['unapprovedUsersAmount'] = found.length
      } else {
        output['unapprovedUsersAmount'] = 0
      }

      AssignmentPacks.find({
        teacher: req.user.email
      })
        .exec()
        .then(found => {
          if (found !== null) {
            output['assignmentsAmount'] = found.length
          } else {
            output['assignmentsAmount'] = 0
          }

          User.find({
            teacher: req.user.email,
            isApproved: true
          })
            .exec()
            .then(found => {
              if (found !== null) {
                output['studentsAmount'] = found.length
              } else {
                output['studentsAmount'] = 0
              }
              output['full_name'] = `${req.user.last_name} ${req.user.first_name} ${req.user.patronymic}`

              res.status(200)
              res.json(output)
            })
        })
    })
    .catch(err => {
      console.log('Error at /api/get-profile-data when searching for notapproved users', err)
      res.status(500)
      res.json({
        SERVER_ERROR: 'SERVER_ERROR'
      })
    })
})

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`) // eslint-disable-line no-console
})
app.disable('etag')

const validateEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}
