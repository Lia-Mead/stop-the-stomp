const express = require("express");
const app = express();
exports.app = app;
const csurf = require("csurf");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
const db = require("./db");
const { hash, compare } = require("./bc");
const fn = require("./fn");

let cookie_sec;
if (process.env.sessionSecret) {
    cookie_sec = process.env.sessionSecret;
} else {
    cookie_sec = require("./secrets").sessionSecret;
}

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
        secret: cookie_sec,
    })
);

app.use(express.urlencoded({ extended: false }));
app.use(csurf()); // has to be after url encoded and cookie session

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

const requireLoggedInUser = (req, res, next) => {
    if (!req.session.userId && req.url != "/register" && req.url != "/login") {
        res.redirect("/register");
    } else {
        next();
    }
}; // runs for every single requests we receive

const requireSignature = (req, res, next) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        next();
    }
};
const requireNoSignature = (req, res, next) => {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        next();
    }
};
const requireLoggedOutUser = (req, res, next) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("registration", {
        title: "sign up",
        layout: "main",
    });
});

app.post("/register", requireLoggedOutUser, (req, res) => {
    // console.log("i am post for register");
    const { first, last, email, pass } = req.body;
    if (first && last && email && pass) {
        hash(pass).then((hashedPw) => {
            db.insertRegData(first, last, email, hashedPw)
                .then(({ rows }) => {
                    // console.log("rows in register: ", rows);
                    req.session.userId = rows[0].id;
                    req.session.loggedIn = rows[0].id;

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

app.get("/profile", requireLoggedInUser, (req, res) => {
    res.render("profile", {
        title: "Profile",
        layout: "main",
    });
});

app.post("/profile", requireLoggedInUser, (req, res) => {
    // console.log("profile post request made");
    let { age, city, url } = req.body;
    age === "" ? (age = null) : age;
    // city === null ? (city = "") : city;

    if (url.startsWith("http://") || url.startsWith("https://")) {
        url = req.body.url;
    } else {
        url = "";
    }

    if (city != "") {
        city = fn.capitalizeLetters(city);
    }
    // console.log("city: ", city);

    db.insUserProf(age, city, url, req.session.userId)
        .then(() => {
            // console.log("profile data city, url");
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in insUserProf", err);
            res.render("profile", {
                title: "Profile page",
                layout: "main",
                errorMessage: "Oops, something went wrong! Please try again.",
            });
        });
});

app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login", {
        title: "Login",
        layout: "main",
    });
});

app.post("/login", requireLoggedOutUser, (req, res) => {
    const { email, pass } = req.body;
    console.log("email, pass", email, pass);
    // if (email) {
    db.getLoginData(email)
        .then(({ rows }) => {
            // console.log("rows in login ", rows);
            const hashedPw = rows[0].password;
            compare(pass, hashedPw)
                .then((match) => {
                    if (match) {
                        req.session.userId = rows[0].id;
                        req.session.loggedIn = rows[0].id;
                        req.session.signatureId = rows[0].signature_id;

                        if (!req.session.signatureId) {
                            res.redirect("/petition");
                        } else {
                            res.redirect("/thanks");
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
    // }
});

app.get("/petition", requireNoSignature, requireLoggedInUser, (req, res) => {
    res.render("petition", {
        title: "Petition Page",
        layout: "main",
    });
});

app.post("/petition", requireNoSignature, requireLoggedInUser, (req, res) => {
    // console.log("req.body", req.body);
    // console.log("req.session", req.session);
    const { signature } = req.body;
    // const { first, last, signature } = req.body;
    if (req.session.userId && req.session.loggedIn) {
        // console.log("cookie log in", req.session);
        if (signature) {
            db.insertSignature(signature, req.session.userId)
                .then(({ rows }) => {
                    req.session.signatureId = rows[0].id;
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

app.get("/thanks", requireSignature, (req, res) => {
    // console.log("req session: ", req.session.userId);
    Promise.all([
        db.pullSig(req.session.signatureId),
        db.numSignatures(),
        db.getName(req.session.userId),
    ])
        .then((results) => {
            // console.log("results: ", results);
            let sigImg = results[0].rows[0].signature;
            let count = results[1].rows[0].count;
            let first = results[2].rows[0].first;

            // console.log("rows: ", rows);
            // console.log("first:", first);
            return res.render("thanks", {
                title: "Thank You Page",
                sigImg,
                count,
                first,
            });
        })
        .catch((err) => {
            console.log("err in pulling signature: ", err);
        });
});

app.post("/thanks", (req, res) => {
    // console.log("post request delete signature was made");
    // console.log("signature id in post thanks", req.session);
    db.deleteSignature(req.session.userId)
        .then(() => {
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in deleteSignature", err);
        });
});

app.get("/signers", requireSignature, (req, res) => {
    // console.log("req.session: ", req.session);
    // console.log("cookie in get signers: ", req.session.signatureId);
    db.getAllSigners()
        .then(({ rows }) => {
            // console.log("result.rows: ", rows);
            res.render("signers", {
                title: "Signers Page",
                layout: "main",
                rows,
            });
        })
        .catch((err) => {
            console.log("error in getAllSigners", err);
        });
});

app.get("/signers/:city", requireSignature, (req, res) => {
    let { city } = req.params;
    db.filterByCity(city)
        .then(({ rows }) => {
            // city = city.toLowerCase();
            console.log("city: ", city);
            res.render("city", {
                title: "Signers in your city",
                layout: "main",
                rows,
                city,
            });
        })
        .catch((err) => {
            console.log("err in filetering city: ", err);
        });
});

app.get("/edit", requireLoggedInUser, (req, res) => {
    db.editProfile(req.session.userId)
        .then(({ rows }) => {
            res.render("edit", {
                title: "Update your profile",
                layout: "main",
                rows,
            });
        })
        .catch((err) => {
            console.log("There was an error in retrieving data from DB: ", err);
        });
});

app.post("/edit", requireLoggedInUser, (req, res) => {
    // console.log("edit post made");
    let { first, last, email, pass, age, city, url } = req.body;
    age === "" ? (age = null) : age;

    if (city != "") {
        city = fn.capitalizeLetters(city);
    }

    if (pass) {
        hash(pass)
            .then((hashedPw) => {
                db.insProfUpdateWithPass(
                    req.session.userId,
                    first,
                    last,
                    email,
                    hashedPw
                )
                    .then(() => {
                        db.upsertProfile(age, city, url, req.session.userId)
                            .then(() => {
                                if (req.session.signatureId) {
                                    res.redirect("/thanks");
                                } else {
                                    res.redirect("/petition");
                                }
                            })
                            .catch((err) => {
                                console.log("error in upsertProfile", err);
                            });
                    })
                    .catch((err) => {
                        console.log("error in insProfUpdateWithPass", err);
                    });
            })
            .catch((err) => {
                console.log("error in hashing", err);
            });
    } else {
        db.insProfUpdateNoPass(req.session.userId, first, last, email)
            .then(() => {
                db.upsertProfile(age, city, url, req.session.userId)
                    .then(() => {
                        if (req.session.signatureId) {
                            res.redirect("/thanks");
                        } else {
                            res.redirect("/petition");
                        }
                    })
                    .catch((err) => {
                        console.log("error in upsertProfile", err);
                    });
            })
            .catch((err) => {
                console.log("error in insProfUpdateWithPass", err);
            });
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () => {
        console.log("petition server is listening...");
    });
}
