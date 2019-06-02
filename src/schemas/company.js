const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Data we need to collect/confirm to have the app go.
const fields = {
  name: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: String,
  domain: [String],
  admins: [{type: ObjectId, ref: 'User'}],
};

// One nice, clean line to create the Schema.
const companySchema = new Schema(fields);

/**
 * Company class
 */
class CompanyClass {
  /*
  // `gravatarImage` becomes a virtual
  get gravatarImage() {
    const hash = md5(this.email.toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}`;
  }

  // `getProfileUrl()` becomes a document method
  getProfileUrl() {
    return `https://mysite.com/${this.email}`;
  }
  */

  /**
   * get Company by matching the name
   * @param {string} name of the company
   * @return {Company} moongoose db object
   */
  static findByName(name) {
    return this.findOne({name: name.toLowerCase()});
  }
}

companySchema.loadClass(CompanyClass);

module.exports = companySchema;
