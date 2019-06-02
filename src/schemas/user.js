const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

// Data we need to collect/confirm to have the app go.
const fields = {
  email: {type: String, required: true, unique: true, trim: true},
  company: {type: ObjectId, ref: 'Company'},
  manager: {type: ObjectId, ref: 'User'},
  isVerified: {type: Boolean, default: false},
  name: {type: String, default: ''},
  groups: [String],
  createdAt: {type: Date, default: Date.now},
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
   * matches the user by email
   * @param {string} email
   * @return {User} user mongo object
   */
  static findByEmail(email) {
    return this.findOne({email: email.trim().toLowerCase()});
  }
}
userSchema.index({email: 1});
userSchema.loadClass(UserClass);

module.exports = userSchema;
