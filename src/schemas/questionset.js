const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Data we need to collect/confirm to have the app go.
const fields = {
  name: {type: String},
  questions: [{type: ObjectId, ref: 'Question'}],
  company: {type: String, lowercase: true},
  date: {type: Schema.Types.Date},
  selector: [String],
};

// One nice, clean line to create the Schema.
const questionSetSchema = new Schema(fields);

questionSetSchema.index({name: 1});
questionSetSchema.index({date: 1});
questionSetSchema.index({selector: 1});


module.exports = questionSetSchema;
