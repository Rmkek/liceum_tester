const mongoose = require('mongoose')
const Schema = mongoose.Schema

const finishedAssignmentPackSchema = Schema({
  packName: { type: String, required: true },
  finishedAssignments: { type: [String], required: true }
})

module.exports = finishedAssignmentPackSchema
