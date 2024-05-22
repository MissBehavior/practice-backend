const crypto = require("crypto");

const keygenerator = () => {
  return crypto.randomBytes(32).toString("hex");
};
console.log(keygenerator());

// module.exports = keygenerator;
