import {Schema as _Schema} from 'mongoose';
const Schema = _Schema;

// Data we need to collect/confirm to have the app go.
const fields = {
  name: {type: String, lowercase: true, trim: true},
  options: [String],
};

// One nice, clean line to create the Schema.
const optionsSchema = new Schema(fields);

optionsSchema.index({name: 1}, {unique: true});

export default optionsSchema;
