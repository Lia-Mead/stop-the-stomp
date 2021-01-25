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

app.get("/", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/register");
    } else if (!req.session.loggedIn && req.session.userId) {
        res.redirect("/login");
    } else {
        res.redirect("/petition");
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
                    req.session.loggedIn = rows[0].id;
                    // req.session.loggedIn === true; // check why not loggedin
                    // console.log("req.session.userId", req.session.userId);
                    console.log("i am logged in", req.session.loggedIn);
                    console.log("cookie log in", req.session);

                    res.redirect("/profile");
                })
                .catch((err) => {
                    console.log("error in insert reg data", err);
                    res.render("registration", {
                        title: "Sign Up Page",
                        errorMessage: "Something went wrong in the DB.",
                    });
                });
        });
    } else {
        res.render("registration", {
            title: "Sign Up Page",
            errorMessage: "Something went wrong. Please fill out all fields",
        });
    }
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        title: "Profile",
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    // console.log("profile post request made");
    let { age, city, url } = req.body;

    if (url.startsWith("http://") || url.startsWith("https://")) {
        url = req.body.url;
    } else {
        url = "";
    }

    db.insUserProf(age, city, url, req.session.userId)
        .then(() => {
            // console.log("profile data city, url");
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in insUserProf", err);
        });
});

app.get("/login", (req, res) => {
    res.render("login", {
        title: "log in",
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    const { email, pass } = req.body;
    if (email) {
        db.getLoginData(email)
            .then(({ rows }) => {
                // console.log("email matches! yay");
                const hashedPw = rows[0].password;
                compare(pass, hashedPw)
                    .then((match) => {
                        // console.log("match value from compare: ", match);
                        if (match) {
                            let signedPetition = rows[0].signature;
                            req.session.userId = rows[0].id;
                            req.session.loggedIn = rows[0].id;
                            console.log("rows: ", rows);
                            console.log("rows sig: ", rows[0].signature);

                            if (signedPetition) {
                                console.log("yayy i signed");
                                res.redirect("./thanks");
                            } else {
                                console.log("no signed");
                                res.redirect("./petition");
                            }
                        } else {
                            res.render("login", {
                                title: "Login Page",
                                errorMessage:
                                    "Something went wrong, wrong password",
                            });
                        }
                    })
                    .catch((err) => {
                        console.log("err in compare", err);
                    });
            })
            .catch((err) => {
                console.log("err in login data", err);
                res.render("login", {
                    title: "Login Page",
                    errorMessage: "Something went wrong, wrong email",
                });
            });
    }
});

// this part doenst work with inserting the sig anymore
app.get("/petition", (req, res) => {
    // console.log("req.session", req.session);
    if (!req.session.userId && !req.session.loggedIn) {
        res.redirect("/register");
    } else if (!req.session.loggedIn && req.session.userId) {
        res.redirect("/login");
    } else if (req.session.loggedIn) {
        console.log("cookie log in petition: ", req.session);
        if (req.session.signatureId) {
            res.redirect("/thanks");
        } else {
            res.render("petition", {
                title: "Petition Page",
                layout: "main",
            });
        }
    }
});

app.post("/petition", (req, res) => {
    // console.log("req.body", req.body);
    // console.log("req.session", req.session);

    const { signature } = req.body;
    // const { first, last, signature } = req.body;
    if (req.session.userId && req.session.loggedIn) {
        console.log("cookie log in", req.session);
        if (signature) {
            db.insertSignature(signature, req.session.userId)
                .then(({ rows }) => {
                    req.session.signatureId = rows[0].id;
                    // console.log("rows[0].id", rows[0].id);
                    // console.log("req.session", req.session);
                    res.redirect("/thanks");
                })
                .catch((err) => {
                    console.log("err in dataBase: ", err);
                });
        } else {
            res.render("petition", {
                title: "Petition Page",
                errorMessage:
                    "There was an error, please fill out all the fields",
            });
        }
    }
});

// check what to store instead of req.session.signatureId
app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
        // check pullSig - parameter email or userId
        Promise.all([db.pullSig(req.session.signatureId), db.numSignatures()])
            .then((results) => {
                // console.log("results: ", results);
                let sigImg = results[0].rows[0].signature;
                let count = results[1].rows[0].count;
                return res.render("thanks", {
                    title: "Thanks Page",
                    sigImg,
                    count,
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
    // check if the sig is in the databbase
    if (req.session.signatureId) {
        db.getAllSigners()
            .then(({ rows }) => {
                // console.log("result.rows: ", rows);
                res.render("signers", {
                    title: "signers",
                    layout: "main",
                    rows,
                });
            })
            .catch((err) => {
                console.log("error in getAllSigners", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers/:city", (req, res) => {
    const { city } = req.params;
    console.log("city: ", city);
    db.filterByCity(city)
        .then(({ rows }) => {
            console.log("city: ", city);
            // console.log("rows:", rows);
            res.render("city", {
                title: "Signers in your city",
                layout: "main",
                rows,
            });
        })
        .catch((err) => {
            console.log("err in filetering city: ", err);
        });
});

app.listen(8080, () => {
    console.log("petition server is listening...");
});
