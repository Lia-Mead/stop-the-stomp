const express = require("express");
const app = express();
const db = require("./db");
const csurf = require("csurf");
const cookieSession = require("cookie-session");
const { sessionSecret } = require("./secrets");
const hb = require("express-handlebars");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// middleware
app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.use(express.static("./public"));

app.use(
    cookieSession({
        maxAge: 1000 * 60 * 24 * 14,
        secret: sessionSecret,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(csurf());

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    // console.log("req.session in middleware", req.session);
    if (req.url == "/petition") {
        next();
    } else {
        if (req.session.signatureId) {
            next();
        } else {
            res.redirect("/petition");
        }
    }
});

app.get("/petition", (req, res) => {
    // console.log("req.session", req.session);
    if (!req.session.signatureId) {
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
    // console.log("req.body", req.body);
    // console.log("req.session", req.session);
    const { first, last, signature } = req.body;

    if (first && last && signature) {
        db.getSignature(first, last, signature)
            .then(({ rows }) => {
                req.session.signatureId = rows[0].id;
                // console.log("signatureId: ", req.session.signatureId);
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("err in dataBase: ", err);
            });
    } else {
        res.render("petition", {
            title: "Petition Page",
            errorMessage: "There was an error, please fill out all forms",
        });
    }
});

// NEW
app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
        Promise.all([db.pullSig(req.session.signatureId), db.numSignatures()])
            .then((results) => {
                // console.log("results: ", results);
                let signature = results[0].rows[0].signature;
                let count = results[1].rows[0].count;

                db.pullSig(req.session.signatureId).then(({ rows }) => {
                    db.numSignatures({ rows });
                    return res.render("thanks", {
                        title: "Thanks Page",
                        layout: "main",
                        rows,
                        signature,
                        count,
                    });
                });
            })
            .catch((err) => {
                console.log("err in pulling signature: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    // console.log("req.session: ", req.session);
    if (req.session.signatureId) {
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
