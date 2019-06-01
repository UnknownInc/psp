/* eslint-disable no-invalid-this */
/**
 * parses the company name from email
 * @param {string} email address
 * @return {string} company name
 */
export function parseCompany(email) {
  const e=(email||'').trim().toLowerCase();
  let i=e.indexOf('@');
  if (i===-1) {
    return null;
  }

  const domain=e.substr(i+1);
  i=domain.indexOf('.');
  if (i===-1) {
    return null;
  }
  return domain.substr(0, i);
}

/**
 * split the email to account@domain
 * domain as company.tld
 * @param {string} emailAddress
 * @return {any} object with properties domain, company
 */
export function getEmailParts(emailAddress) {
  let isValid = false;
  const email = (emailAddress||'').toLowerCase();
  let accountname; let companyname; let domain;

  let i=email.indexOf('@');
  if (i>0) {
    accountname = email.substr(0, i).trim();
    domain = email.substr(i+1).trim();

    i=domain.indexOf('.');
    if (i>0) {
      companyname=domain.substr(0, i);
      isValid=true;
    } else {
      isValid=false;
    }
  }
  return {
    isValid,
    address: email,
    accountname,
    companyname,
    domain,
  };
}

/**
 * asyncHelper function for async loops
 */
export function AsyncHelper() {
  const self = this;

  this.each = async (items, fn) => {
    if (items && items.length) {
      await Promise.all(
          items.map(async (item) => {
            await fn(item);
          }));
    }
  };

  this.reduce = async (items, fn, initialValue) => {
    await self.each(
        items, async (item) => {
          initialValue = await fn(initialValue, item);
        });
    return initialValue;
  };
};
