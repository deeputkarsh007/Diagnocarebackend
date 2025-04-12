const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
  // testId: String,
  testName: String,
  testDetails: [
    {
      investigation: String,
      units: String,
      min: Number,
      max: Number,
    },
  ],
});

const Test = mongoose.model("Test", testSchema);

module.exports = Test;
