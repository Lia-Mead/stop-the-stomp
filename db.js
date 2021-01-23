// this module holds all the queries we'll be using to talk to our data base

const spicedPg = require("spiced-pg");
const { dbUsername, dbPass } = require("./secrets");
const db = spicedPg(`postgres:${dbUsername}:${dbPass}@localhost:5432/petition`);

module.exports.getAllSignatures = () => {
    const q = `SELECT first, last FROM users`;
    return db.query(q);
};

module.exports.insertSignature = (signature, userId) => {
    const q = `INSERT INTO signatures (signature, user_id)
    VALUES ($1, $2) RETURNING id`;
    const params = [signature, userId];
    return db.query(q, params);
};

module.exports.insertRegData = (first, last, email, hashedPw) => {
    const q = `INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [first, last, email, hashedPw];
    console.log("params", params);
    return db.query(q, params);
};

module.exports.numSignatures = () => {
    const q = `SELECT COUNT(*) FROM signatures`;
    // console.log("numSignatures: ", q);
    return db.query(q);
};

module.exports.pullSig = (signature) => {
    const q = `SELECT signature FROM signatures WHERE id = $1`;
    const params = [signature];
    return db.query(q, params);
};

module.exports.getLoginData = (email) => {
    const q = `SELECT * FROM users WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};
