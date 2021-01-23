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

// app.use((req, res, next) => {
//     if (req.url == "/login") {
//         next();
//     } else if (req.url == "/register") {
//         next();
//     } else if (req.url == "/petition") {
//         next();
//     } else {
//         if (req.session.signatureId) {
//             next();
//         } else if (req.session.userId) {
//             next();
//         } else if (req.session.loggedIn) {
//             next();
//         } else {
//             res.redirect("/register");
//         }
//     }
// });

// this doesn't work

// app.use((req, res, next) => {
//     // console.log("req.session in middleware", req.session);
//     if (req.url == "/petition") {
//         next();
//     } else {
//         if (req.session.signatureId) {
//             next();
//         } else {
//             res.redirect("/petition");
//         }
//     }
// });

// app.use((req, res, next) => {
//     next();
// });

// app.use((req, res, next) => {
//     if (req.url == "/petition") {
//         next();
//     } else {
//         if (
//             req.session.signatureId ||
//             req.session.uderId ||
//             req.session.loggedIn
//         ) {
//             next();
//         } else {
//             res.redirect("/petition");
//         }
//     }
// });

//  !req.session.userId;
// return res.redirect("/register");

// app.use((req, res, next) => {
//     if (req.url == "/petition" && !req.session.userId) {
//         return res.redirect("/register");
//     } else if (req.url == "/petition" && !req.session.loggedIn) {
//         return res.redirect("/login");
//     } else if (req.url == "/register" && req.session.userId) {
//         return res.redirect("/login");
//     }
//     next();
// });

// app.use((req, res, next) => {
//     if (req.url == "/petition" && !req.session.userId) {
//         return res.redirect("/register");
//     } else if (req.url == "/petition" && !req.session.loggedIn) {
//         return res.redirect("/login");
//     }
//     next();
// });

//almost working last version
// app.use((req, res, next) => {
//     if (req.url == "/petition") {
//         if (!req.session.userId) {
//             console.log("userId", req.session.userId);
//             return res.redirect("/register");
//         } else if (!req.session.loggedIn && req.session.userId) {
//             console.log("userId", req.session.userId);

//             return res.redirect("/login");
//         }
//         // res.redirect("/petition");
//     }
//     next();
// });

// app.use((req, res, next) => {
//     next();
// });

app.get("/", (req, res) => {
    if (!req.session.userId) {
        // console.log("userId", req.session.userId);
        console.log("no user id - sign up");
        res.redirect("/register");
    } else if (!req.session.loggedIn && req.session.userId) {
        // console.log("userId", req.session.userId);
        console.log("not logged in - log in");

        res.redirect("/login");
    } else {
        console.log("go to petition");
        res.redirect("/petition");
    }
});

// req.session.signatureId;

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
                    req.session.loggedIn === true;
                    console.log("req.session.userId", req.session.userId);
                    console.log("rows[0]", rows[0]);

                    res.redirect("/petition");
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
                            req.session.loggedIn = rows[0].id;
                            if (req.session.signatureId) {
                                res.redirect("./thanks");
                            } else {
                                res.redirect("./petition");
                            }
                        } else {
                            res.render("login", {
                                title: "Login Page",
                                errorMessage: "Something went wrong",
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
                    errorMessage: "Something went wrong",
                });
            });
    }
});

// app.get("/petition", (req, res) => {
//     // console.log("req.session", req.session);
//     if (req.session.signatureId) {
//         return res.redirect("/thanks");
//     } else {
//         return res.render("petition", {
//             title: "Petition Page",
//             layout: "main",
//         });
//     }

app.get("/petition", (req, res) => {
    // console.log("req.session", req.session);
    if (!req.session.userId && !req.session.loggedIn) {
        res.redirect("/register");
    } else if (!req.session.loggedIn && req.session.userId) {
        res.redirect("/login");
    } else if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            title: "Petition Page",
            layout: "main",
        });
    }

    // app.get("/petition", (req, res) => {
    //     // console.log("req.session", req.session);
    //     if (!req.session.signatureId) {
    //         if (!req.session.userId) {
    //             res.redirect("/register");
    //         } else if (!req.session.loggedIn) {
    //             res.redirect("/login");
    //         }
    //         res.render("petition", {
    //             title: "Petition Page",
    //             layout: "main",
    //         });
    //     } else {
    //         res.redirect("/thanks");
    //     }

    // if (!req.session.signatureId) {
    //     // if (!req.session.loggedIn) {
    //     //     console.log("login");
    //     // } else if (!req.session.userId) {
    //     //     console.log("register");
    //     // }
    //     res.render("petition", {
    //         title: "petition",
    //         layout: "main",
    //     });
    // } else {
    //     res.redirect("/thanks");
    // }
});

app.post("/petition", (req, res) => {
    // console.log("req.body", req.body);
    // console.log("req.session", req.session);

    const { signature } = req.body;
    // const { first, last, signature } = req.body;
    if (req.session.userId && req.session.loggedIn) {
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

app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
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
