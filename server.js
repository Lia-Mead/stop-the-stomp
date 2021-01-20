const express = require("express");
const app = express();
const db = require("./db");
const cookieParser = require("cookie-parser");
// getting info from db

const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

// middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    if (req.url == "/petition") {
        next();
    } else {
        if (req.cookies.signed) {
            next();
        } else {
            res.redirect("/petition");
        }
    }
});

app.get("/petition", (req, res) => {
    if (!req.cookies.signed) {
        res.render("petition", {
            title: "petition",
            layout: "main",
        });
    } else {
        res.redirect("/thanks");
    }
});

app.post("/petition", (req, res) => {
    // console.log("post to petition was made");
    console.log("req.body", req.body);
    const { first, last, signature } = req.body;

    if (first && last && signature) {
        res.cookie("signed", true);
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            title: "Petition Page",
            errorMessage: "There was an error, please fill out all forms",
        });
    }
    // console.log("req.body: ", req.body);
    db.getSignature(first, last, signature)
        .then(() => {
            console.log("results from getSignature: ");
        })
        .catch((err) => {
            console.log("err in dataBase: ", err);
        });
});

app.get("/thanks", (req, res) => {
    if (req.cookies.signed) {
        db.numSignatures()
            .then(({ rows }) => {
                res.render("thanks", {
                    title: "Thanks Page",
                    layout: "main",
                    rows,
                });
            })
            .catch((err) => {
                console.log("error in getAllSignatures: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    if (req.cookies.signed) {
        db.getAllSignatures()
            .then(({ rows }) => {
                // console.log("result.rows: ", rows);
                res.render("signers", {
                    title: "signers",
                    layout: "main",
                    rows,
                });
            })
            .catch((err) => {
                console.log("error in getAllSignatures", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.listen(8080, () => {
    console.log("petition server is listening...");
});

// app.get("/actors", (req, res) => {
//     db.getActors()
//         .then(({ rows }) => {
//             console.log("results from getActors: ", rows);
//         })
//         .catch((err) => {
//             console.log("err in dataBase: ", err);
//         });
// });

// // .then((results) => {
// //             console.log("results from getActors: ", results.rows);
// //         })

// // adding info from db
// app.post("/add-actor", (req, res) => {
//     console.log("hit POST add-actor route");

//     // we have yet to create the query
//     db.getActor("Janelle Monae", 35)
//         .then(() => {
//             console.log("yay it worked");
//         })
//         .catch((err) => {
//             console.log("err in AddActor", err);
//         });
// });
