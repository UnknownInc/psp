const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Data we need to collect/confirm to have the app go.
const fields = {
  user: {type: ObjectId, ref: 'User'},
  set: {type: ObjectId},
  question: {type: ObjectId},
  date: {type: Date, index: true},
  response: {type: String, lowercase: true, trim: true},
};

// One nice, clean line to create the Schema.
const responseSchema = new Schema(fields);

responseSchema.index({user: 1});
responseSchema.index({date: 1});
responseSchema.index({set: 1});
responseSchema.index({question: 1});

module.exports = responseSchema;
