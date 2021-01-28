// this module holds all the queries we'll be using to talk to our data base

const spicedPg = require("spiced-pg");
// const { dbUsername, dbPass } = require("./secrets");
// const db = spicedPg(`postgres:${dbUsername}:${dbPass}@localhost:5432/petition`);

let db;
if (process.env.DATABASE_URL) {
    // this means we are on production - heroku
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { dbUsername, dbPass } = require("./secrets.json");
    db = spicedPg(`postgres:${dbUsername}:${dbPass}@localhost:5432/petition`);
}

module.exports.getAllSigners = () => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url FROM signatures
    JOIN users
    ON users.id = signatures.user_id
    LEFT JOIN user_profiles
    ON user_profiles.user_id = signatures.user_id`;
    return db.query(q);
};

module.exports.filterByCity = (city) => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.url, user_profiles.city FROM signatures
    JOIN users
    ON users.id = signatures.user_id
    LEFT JOIN user_profiles
    ON user_profiles.user_id = signatures.user_id
    WHERE LOWER(user_profiles.city) = LOWER($1)`;
    const params = [city];
    return db.query(q, params);
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
    const q = `SELECT signature, user_id FROM signatures WHERE id = $1`;
    const params = [signature];
    return db.query(q, params);
};

module.exports.getLoginData = (email) => {
    const q = `SELECT users.id, users.password, signatures.id AS signature_id
    FROM users
    LEFT JOIN signatures
    ON users.id = signatures.user_id
    WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};

module.exports.insUserProf = (age, city, url, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

module.exports.editProfile = (users_id) => {
    const q = `SELECT users.id, users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
    FROM users
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE user_profiles.user_id = $1`;
    const params = [users_id];
    return db.query(q, params);
};

module.exports.insProfUpdateWithPass = (userId, first, last, email, pass) => {
    const q = `UPDATE users
    SET first = $2, last = $3, email = $4, password = $5
    WHERE id = $1`;
    const params = [userId, first, last, email, pass];
    return db.query(q, params);
};

module.exports.insProfUpdateNoPass = (userId, first, last, email) => {
    const q = `UPDATE users
    SET first = $2, last = $3, email = $4
    WHERE id = $1`;
    const params = [userId, first, last, email];
    return db.query(q, params);
};

module.exports.upsertProfile = (age, city, url, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age= $1, city=$2, url=$3`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

module.exports.deleteSignature = (userId) => {
    const q = `DELETE FROM signatures WHERE user_id = $1`;
    const params = [userId];
    return db.query(q, params);
};

module.exports.getName = (userId) => {
    const q = `SELECT users.first, users.last FROM users
    WHERE id = $1`;
    const params = [userId];
    return db.query(q, params);
};
