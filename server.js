require('isomorphic-fetch') // used by dropbox api
// server must-haves
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const uuid = require('uuid/v4')

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

// executing user code
const { execSync } = require('child_process')

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

const CODE_SAVING_DIRECTORY = path.resolve(__dirname, './testing_folder')
console.log('Resolved code saving directory: ', CODE_SAVING_DIRECTORY)

if (!fs.existsSync(CODE_SAVING_DIRECTORY)) {
  fs.mkdirSync(CODE_SAVING_DIRECTORY)
}

app.set('port', process.env.LOCAL_SERVER_PORT || process.env.PORT)

app.use(opbeat.middleware.express())
app.use(
  session({
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    }),
    secret: process.env.SESSION_SECRET_KEY,
    cookie: {
      maxAge: 10 * 60 * 1000,
      httpOnly: false
    },
    resave: false,
    saveUninitialized: true
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
// TODO: think about production and serving static files.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'))
}

console.log('currentdir: ', __dirname)
console.log('resolved static path: ', path.resolve(__dirname, './client/build'))

app.use(express.static(path.resolve(__dirname, './client/build')))

app.get('/admin*', checkLoginMiddleware({ user: 'ADMIN' }))
app.get('/teacher*', checkLoginMiddleware({ user: 'TEACHER' }))

// refactor?
app.post('/api/add-assignment', checkLoginMiddleware({ user: 'TEACHER' }), (req, res) => {
  console.log('Got request on /api/add-assignment, body: ', req.body)

  let name = req.body.assignmentPackName
  let categories = req.body.assignmentPackCategories.split(',')
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
          pdfFileURL = data.url.substring(0, data.url.length - 1) + '1'
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
          console.log('categories: ', categories)
          console.log('tasks: ', tasksArray)
          new AssignmentPacks({
            pdfPath: pdfFileURL,
            name,
            categories,
            tasks: tasksArray,
            teacher: req.user.full_name
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

app.post('/api/assignments', checkLoginMiddleware({}), (req, res) => {
  AssignmentPacks.find({ teacher: req.user.teacher })
    .exec()
    .then(found => {
      const output = []

      found.forEach(element => {
        output.push({
          name: element.name,
          category: element.category
        })
      })
      res.status(200)
      res.json(output)
    })
    .catch(err => {
      console.log('Error happened at /api/assignments ', err)
    })
})

app.post('/api/getAssignmentPack', checkLoginMiddleware({}), (req, res, next) => {
  if (req.body.assignmentPack === undefined) {
    res.status(400)
    res.json(ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT)
    next()
  }

  const assignmentPack = req.body.assignmentPack

  AssignmentPacks.findOne({
    name: assignmentPack,
    teacher: req.user.teacher
  })
    .exec()
    .then(found => {
      console.log('found assignments: ', found)

      if (found === undefined || found === null) {
        res.status(500)
        res.json(ASSIGNMENT_CONSTANTS.NO_SUCH_ASSIGNMENT)
        next()
      }

      console.log('req.user: ', req.user)

      const userAssignments = req.user.assignments

      let output = {
        pdfPath: found.pdfPath,
        tasks: []
      }
      // checking that user has atleast some solved assignments
      if (userAssignments === null || userAssignments === undefined || userAssignments.length === 0) {
        found.tasks.forEach(task => {
          output.tasks.push({
            name: task.name,
            id: task._id,
            solved: false
          })
        })
        res.status(200)
        res.json(output)
        next()
      } else {
        let assignments = null

        // checking that user has current assignment solved
        for (let i = 0; i < userAssignments.length; i++) {
          if (userAssignments[i].packName === assignmentPack) {
            assignments = userAssignments[i]
          }
        }

        // user does not solved this assignmentPack yet, returning him all assignments as non-solved.
        if (assignments === null) {
          found.tasks.forEach(task => {
            output.tasks.push({
              name: task.name,
              id: task._id,
              solved: false
            })
          })

          res.status(200)
          res.json(output)
          next()
        } else {
          found.tasks.forEach(task => {
            output.tasks.push({
              name: task.name,
              id: task._id,
              solved: assignments.finishedAssignments.includes(task._id.toString())
            })
          })

          res.status(200)
          res.json(output)
          next()
        }
      }
    })
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
                  full_name: req.body.full_name,
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
                new User({
                  email: req.body.email,
                  password_hash: hash,
                  isApproved: false,
                  isAdmin: false,
                  teacher: req.body.teacher,
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
  // TODO: check for user being admin
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
        teacher: req.user.full_name
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
        res.redirect('/add-info')
      }
    })
  })(req, res, next)
})

app.post('/api/getNotApprovedUsers', checkLoginMiddleware({ user: 'TEACHER' }), (req, res) => {
  // TODO check for user being admin
  console.log('Got request on api/getNotApprovedUsers')
  User.find({
    isApproved: false,
    teacher: req.user.full_name
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

app.post('/api/add-info', checkLoginMiddleware({}), (req, res) => {
  // TODO check add-info for user having session. If there is no session, redirect to login page.
  let name = req.body.name
  let grade = req.body.grade
  let letter = req.body.letter

  let updateObject = {
    name,
    grade,
    letter
  }

  req.user.additional_info = updateObject

  User.findByIdAndUpdate(req.user._id, req.user, {
    new: true
  })
    .exec()
    .then(updatedUser => {
      res.status(200)
      res.json(INFO_CONSTANTS.INFO_ADDED)
    })
    .catch(err => {
      console.log('Error at /api/add-info: ', err)
      res.status(500)
      res.json(INFO_CONSTANTS.INFO_NOT_ADDED)
    })
})

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

  console.log('req.files', req.files)
  console.log('req.body: ', req.body)
  const file = req.files.codeFile
  const codeFileName = uuid()

  file.mv(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
    if (err) {
      console.log('Error happened while saving pdf: ', err)

      res.status(500)
      res.json(CODE_TESTING_CONSTANTS.SERVER_ERROR)
      next()
    }
  })

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

    let testIterator = 1

    task.tests.every(test => {
      try {
        let output = execSync(
          `cd ${CODE_SAVING_DIRECTORY} && g++ ${codeFileName}.cpp -o ${codeFileName}.out && ./${codeFileName}.out ${test.input}`,
          'utf8'
        ).toString()

        if (output !== test.output) {
          console.log(`Failed on test #${testIterator}`)

          fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.cpp`, err => {
            if (err) console.log('Error happened when deleting code: ', err)
            console.log(`${codeFileName}.cpp was deleted`)
          })
          fs.unlink(`${CODE_SAVING_DIRECTORY}/${codeFileName}.out`, err => {
            if (err) console.log('Error happened when deleting binary: ', err)
            console.log(`${codeFileName}.out was deleted`)
          })

          res.status(500)
          CODE_TESTING_CONSTANTS.TESTS_FAILED.on_test = testIterator
          res.json(CODE_TESTING_CONSTANTS.TESTS_FAILED)
          next()
          return false
        }

        testIterator++
        return true
      } catch (e) {
        console.log('Error happened while executing code.', e)
        res.status(500)
        res.json(CODE_TESTING_CONSTANTS.CODE_ERROR)
      }
    })

    console.log('uploading code, User:', req.user)
    if (req.user.assignments === undefined || req.user.assignments === null || req.user.assignments.length === 0) {
      const finishedAssignments = new FinishedAssignmentPack({
        packName: assignmentPack,
        finishedAssignments: [assignmentID]
      })

      req.user.assignments = [finishedAssignments]
    } else {
      for (let i = 0; i < req.user.assignments.length; i++) {
        if (req.user.assignments[i].packName === assignmentPack) {
          if (req.user.assignments.finishedAssignments.includes(assignmentID)) {
            res.status(400)
            res.status(CODE_TESTING_CONSTANTS.TESTS_ALREADY_PASSED)
            next()
          } else {
            req.user.assignments.finishedAssignments.push(assignmentID)
          }
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
        answer.push(el.full_name)
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
    res.redirect('/add-info')
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
  if (req.user === null || req.user.additional_info === undefined || req.user.additional_info === undefined) {
    res.status(200)
    res.json(INFO_CONSTANTS.INFO_NOT_ADDED)
  } else {
    res.status(200)
    res.json({
      success: INFO_CONSTANTS.INFO_ADDED,
      name: req.user.additional_info.name
    })
  }
})

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`) // eslint-disable-line no-console
})
app.disable('etag')

const validateEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}
