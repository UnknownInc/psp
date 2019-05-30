const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Data we need to collect/confirm to have the app go.
const fields = {
  name: {type: String},
  questions: [{type: ObjectId}],
  company: {type: String, lowercase: true},
  Date: {type: Schema.Types.Date},
  selector: [String],
};

// One nice, clean line to create the Schema.
const questionSetSchema = new Schema(fields);

module.exports = questionSetSchema;
