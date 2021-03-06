const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Data we need to collect/confirm to have the app go.
const fields = {
  name: {type: String, default: ''},
  // eslint-disable-next-line max-len
  email: {type: String, required: true, unique: true, trim: true, lowercase: true},
  roles: [String],
  tags: [String],
  title: {type: String},
  careerStage: {type: String},
  capability: {type: String},
  primarySkill: {type: String},
  skills: [{type: String}],
  clients: [{type: String}],
  industry: {type: String},
  details: {type: Object},
  oid: {type: String, trim: true},
  company: {type: ObjectId, ref: 'Company'},
  isVerified: {type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now},
  lastresponsedate: {type: Date},
  lastactivedate: {type: Date},
};

// One nice, clean line to create the Schema.
const userSchema = new Schema(fields);

/**
 * Class for User model stadin
 */
class UserClass {
  /**
   * get the gravatarImage based on the the email
   * @return {string} gravatar url
   */
  get gravatarImage() {
    const hash = md5(this.email.toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}`;
  }

  /*
  // `getProfileUrl()` becomes a document method
  getProfileUrl() {
    return `https://mysite.com/${this.email}`;
  }
  */

  /**
   * checks if role is present in the user roles
   * @param {string} role
   * @return {boolean} if the role exists in user roles
   */
  isInRole(role) {
    return (this.roles||[]).indexOf(role)!=-1;
  }

  /**
   * matches the user by email
   * @param {string} email
   * @return {User} user mongo object
   */
  static findByEmail(email) {
    return this.findOne({email: email.trim().toLowerCase()});
  }
}
userSchema.index({email: 1}, {unique: true});
userSchema.index({tags: 1});
userSchema.index({title: 1});
userSchema.index({capability: 1});
userSchema.index({industry: 1});
userSchema.index({clients: 1});
userSchema.index({oid: 1});

userSchema.loadClass(UserClass);

export default userSchema;
