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
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  patronymic: {
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
  assignments: {
    type: [finishedAssignmentPacks]
  },
  created_at: {
    type: Date,
    required: true
  },
  categories: {
    type: [String],
    required: false
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
