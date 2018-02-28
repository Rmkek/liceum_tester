const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const assignmentTaskSchema = Schema({
  name: { type: String, required: true },
  tests: { type: [{ input: String, output: String }], required: true }
});

module.exports = assignmentTaskSchema;
