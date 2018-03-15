const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AssignmentTask = require('./schemas/AssignmentTask')

const assignmentPacksSchema = Schema({
  name: { type: String, required: true },
  categories: { type: [String], required: true },
  pdfPath: { type: String, required: true },
  tasks: { type: [AssignmentTask], required: true },
  teacher: { type: String, required: true }
})

const AssignmentPacks = mongoose.model('AssignmentPacks', assignmentPacksSchema, 'assignments')

module.exports = AssignmentPacks
