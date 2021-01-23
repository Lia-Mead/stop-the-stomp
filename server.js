const express = require("express");
const app = express();
const csurf = require("csurf");
const cookieSession = require("cookie-session");
const { sessionSecret } = require("./secrets");
const hb = require("express-handlebars");

const db = require("./db");
const { hash, compare } = require("./bc");
// const bc = require("./bc");
// bc.compare();

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

// this doesn't work
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

app.get("/register", (req, res) => {
    res.render("registration", {
        title: "sign up",
        layout: "main",
    });
});

app.post("/register", (req, res) => {
    // console.log("i am post for register");
    const { first, last, email, pass } = req.body;
    if (first && last && email && pass) {
        hash(pass).then((hashedPw) => {
            db.insertRegData(first, last, email, hashedPw)
                .then(({ rows }) => {
                    req.session.userId = rows[0].id;
                    // console.log("req.session.userId", req.session.userId);
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("error in insert reg data", err);
                });
        });
    }
});

app.get("/login", (req, res) => {
    res.render("login", {
        title: "log in",
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    // cmopare values
    // go to db, check if the email the user provided existes, and if yes - retrive stored hash and pass that to compare are the second argument
    // const hashFromDB = "someHash"; // actual pass from db
    const { email, pass } = req.body;
    if (email) {
        db.getLoginData(email)
            .then(({ rows }) => {
                // const emailDB = rows[0].email;
                // console.log("email matches! yay");
                const hashedPw = rows[0].password;
                compare(pass, hashedPw)
                    .then((match) => {
                        console.log("match value from compare: ", match);
                        req.session.loggedIn = rows[0].id;
                        console.log(
                            "req.session.loggedIn",
                            req.session.loggedIn
                        );
                        res.redirect("./petition");
                        // if pass matches set new cookie with userId
                        // if not oops sth went wrong
                    })
                    .catch((err) => {
                        console.log("err in compare", err);
                    });
            })
            .catch((err) => {
                console.log("err in compare", err);
            });
    } else {
        res.render("login", {
            title: "Login Page",
            errorMessage: "Something went wrong",
        });
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
    // console.log("req.body", req.body);
    // console.log("req.session", req.session);

    const { signature } = req.body;
    // const { first, last, signature } = req.body;

    if (signature) {
        db.insertSignature(signature)
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

// here hash the password the user gives out of req.body
// req.body.password (hardcoded for demo purpose)

// hash("whateverUserWantsPass")
//     .then((hashedPw) => {
//         console.log("hashedPw in /register:", hashedPw);
//         // add all user info plus the hashed PW into our db
//         // if it worked - redirect
//         // if went wrong - render error message
//     })
//     .catch((err) => {
//         console.log("err in hash", err);
//     });
// // redirect to petition - don't send a status
