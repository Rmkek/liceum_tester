const mongoose = require('mongoose')
const Schema = mongoose.Schema
const finishedAssignmentPacks = require('./schemas/FinishedAssignmentPacks')

const userSchema = Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  isApproved: { type: Boolean, required: true },
  isAdmin: { type: Boolean, required: false, default: false },
  additional_info: {
    type: {
      name: String,
      grade: Number,
      grade_letter: String
    },
    required: false
  },
  assignments: { type: [finishedAssignmentPacks], required: false },
  created_at: { type: Date, required: true }
})

const User = mongoose.model('User', userSchema)

module.exports = User
