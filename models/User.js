const mongoose = require('mongoose')
const Schema = mongoose.Schema
const finishedAssignmentPacks = require('./schemas/FinishedAssignmentPacks')

const userSchema = Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password_hash: {
    type: String,
    required: true
  },
  isApproved: {
    type: Boolean,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isTeacher: {
    type: Boolean,
    default: false
  },
  full_name: {
    type: String
  },
  school: {
    type: String
  },
  teacher: {
    type: String
  },
  additional_info: {
    type: {
      name: String,
      grade: Number,
      grade_letter: String
    }
  },
  assignments: {
    type: [finishedAssignmentPacks]
  },
  created_at: {
    type: Date,
    required: true
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
