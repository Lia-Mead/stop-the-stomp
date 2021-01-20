// this module holds all the queries we'll be using to talk to our data base

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// spicesPg (whoDoWeWantToTalkTo:WhichUserShouldBeRunningOurQueries:WhatPasswordDoesThisUserHave@whereCommunicationHappens:specifiedPortForCommunication/NameOfOurDataBase)

module.exports.getActors = () => {
    const q = `SELECT * FROM actors`;
    return db.query(q);
};

module.exports.getActor = (actorName, actorAge) => {
    const q = `INSERT INTO actors (name, age)
    VALUES ($1,$2)`;
    const params = [actorName, actorAge];
    return db.query(q, params);
    // return db.query(
    //     `INSERT INTO actors (name, age)
    // VALUES ($1,$2)`,
    //     [actorName, actorAge]
    // );
};
