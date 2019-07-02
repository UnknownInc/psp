const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Data we need to collect/confirm to have the app go.
const fields = {
  question: {type: String},
  category: {type: String},
  options: [{option: String, value: String}],
  tags: [String],
  followup: {type: ObjectId, ref: 'Question'},
  createdAt: {type: Date, default: Date.now},
  createdBy: {type: String},
  modifiedAt: {type: Date, default: Date.now},
  modifiedBy: {type: String},
  targetlevels: {type: String, default: 'all'},
  targetmintenure: {type: Number, default: 0},
};

// One nice, clean line to create the Schema.
const questionSchema = new Schema(fields);

questionSchema.index({question: 1});
questionSchema.index({category: 1});
questionSchema.index({tags: 1});
module.exports = questionSchema;
