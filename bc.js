const bcrypt = require("bcryptjs");
let { genSalt, hash, compare } = bcrypt;
const { promisify } = require("util");

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.compare = compare;
module.exports.hash = (plainTextPw) =>
    genSalt().then((salt) => hash(plainTextPw, salt));

// genSalt()
//     .then((salt) => {
//         console.log("salt: ", salt);
//         return hash("123456", salt);
//     })
//     .then((hashedPw) => {
//         console.log("hashed passaword with salt", hashedPw);
//         return compare("123456", hashedPw);
//     })
//     .then((matchValueOfCompare) => {
//         console.log("do the passwords match", matchValueOfCompare);
//     });
