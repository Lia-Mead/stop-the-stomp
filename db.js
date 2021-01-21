// this module holds all the queries we'll be using to talk to our data base

const spicedPg = require("spiced-pg");
const { dbUsername, dbPass } = require("./secrets");
const db = spicedPg(`postgres:${dbUsername}:${dbPass}@localhost:5432/petition`);

module.exports.getAllSignatures = () => {
    const q = `SELECT first, last FROM signatures`;
    return db.query(q);
};

module.exports.getSignature = (firstName, lastName, signature) => {
    const q = `INSERT INTO signatures (first, last, signature)
    VALUES ($1,$2, $3) RETURNING id`;
    const params = [firstName, lastName, signature];
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
