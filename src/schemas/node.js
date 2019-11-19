import {Schema as _Schema} from 'mongoose';
const Schema = _Schema;
import MpathPlugin from 'mongoose-mpath';

const ObjectId = Schema.Types.ObjectId;

// Data we need to collect/confirm to have the app go.
const fields = {
  name: {type: String, default: ''},
  user: {type: ObjectId, ref: 'User'},
  children: [{type: ObjectId, ref: 'User'}],
  type: {type: String},
  tags: [String],
  createdAt: {type: Date, default: Date.now},
};

// One nice, clean line to create the Schema.
const nodeSchema = new Schema(fields);
nodeSchema.plugin(MpathPlugin, {
  // idType: String,
  pathSeparator: '|',
  onDelete: 'REPARENT',
});

// class NodeClass {

// }
// nodeSchema.loadClass(NodeClass);

nodeSchema.index({user: 1});
nodeSchema.index({name: 1});
nodeSchema.index({children: 1});

export default nodeSchema;
