// this module holds all the queries we'll be using to talk to our data base

const spicedPg = require("spiced-pg");
const { dbUsername, dbPass } = require("./secrets");
const db = spicedPg(`postgres:${dbUsername}:${dbPass}@localhost:5432/petition`);
// spicesPg (whoDoWeWantToTalkTo:WhichUserShouldBeRunningOurQueries:WhatPasswordDoesThisUserHave@whereCommunicationHappens:specifiedPortForCommunication/NameOfOurDataBase)

module.exports.getAllSignatures = () => {
    const q = `SELECT first, last FROM signatures`;
    return db.query(q);
};

module.exports.getSignature = (firstName, lastName, signature) => {
    const q = `INSERT INTO signatures (first, last, signature)
    VALUES ($1,$2, $3)`;
    const params = [firstName, lastName, signature];
    return db.query(q, params);
    // return db.query(
    //     `INSERT INTO actors (name, age)
    // VALUES ($1,$2)`,
    //     [actorName, actorAge]
    // );
};

module.exports.numSignatures = () => {
    const q = `SELECT COUNT(*) FROM signatures`;
    // console.log("numSignatures: ", q);
    return db.query(q);
};

// module.exports.getActors = () => {
//     const q = `SELECT * FROM actors`;
//     return db.query(q);
// };

// module.exports.getActor = (actorName, actorAge) => {
//     const q = `INSERT INTO actors (name, age)
//     VALUES ($1,$2)`;
//     const params = [actorName, actorAge];
//     return db.query(q, params);
//     // return db.query(
//     //     `INSERT INTO actors (name, age)
//     // VALUES ($1,$2)`,
//     //     [actorName, actorAge]
//     // );
// };
