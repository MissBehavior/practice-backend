// NOT USED ONLY USED FOR JWT TOKEN PRIVATE KEY GENERATION
const crypto = require("crypto");

const keygenerator = () => {
  return crypto.randomBytes(32).toString("hex");
};
console.log(keygenerator());
