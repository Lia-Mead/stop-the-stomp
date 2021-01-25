// this module holds all the queries we'll be using to talk to our data base

const spicedPg = require("spiced-pg");
const { dbUsername, dbPass } = require("./secrets");
const db = spicedPg(`postgres:${dbUsername}:${dbPass}@localhost:5432/petition`);

module.exports.getAllSigners = () => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url, signatures.signature FROM users
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id
    LEFT JOIN signatures
    ON users.id = signatures.user_id`;
    return db.query(q);
};

module.exports.filterByCity = (city) => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url, signatures.signature FROM users
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    JOIN signatures
    ON users.id = signatures.user_id
    WHERE LOWER(user_profiles.city) = LOWER($1)`;
    const params = [city];
    return db.query(q, params);
};

// module.exports.getAllSigners = () => {
//     const q = `SELECT users.first, users.last, user_profiles.age user_profiles.city, user_profiles.url, signatures.signature
//     FROM users
//     LEFT JOIN user_profiles
//     ON users.id = user_profiles.user_id
//     LEFT JOIN signatures
//     ON users.id = signatures.user_id`;
//     return db.query(q);
// };

// module.exports.displaySignatures = () => {
//     const q = `SELECT signature FROM signatures
//     JOIN signature
//     ON users.id = signatures.user_id`;
//     return db.query(q);
// };

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

module.exports.insUserProf = (age, city, url, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};
