const express = require("express");
const app = express();
const db = require("./db");
const cookieParser = require("cookie-parser");
// getting info from db

const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    if (req.url == "/petition") {
        next();
    } else {
        if (req.cookies.sign) {
            res.redirect("/thanks");
            // next();
        } else {
            // res.cookie("signedCookie", req.sign);
            res.redirect("/petition");
        }
    }
});
// app.use((req, res) => {
//     if (req.url == "/petition") {
//         if (req.cookies.sign) {
//             res.redirect("/thanks");
//         } else {
//             res.cookie("sign", req.sign);
//             res.redirect("/petition");
//         }
//     }
// });

app.use(express.static("./public"));

app.get("/petition", (req, res) => {
    // res.render("petition", {
    //     title: "petition",
    //     layout: "main",
    // });
    res.send(`
        <form method='POST' style="display: flex; flex-direction: column; justify-content: space-between; width: 60%; height: 20%; font-family: Arial">
            <button name="sign" type="submit" style="padding: 15px; background-color:#9bffdd">Submit</button>
        </form>`);
});

app.post("/petition", (req, res) => {
    console.log("post to petition was made");
    const { sign } = req.body;
    console.log("req.body: ", req.body);

    if (sign) {
        res.cookie("sign", true);
        res.redirect("/thanks");
    } else {
        res.send("You need to sign");
    }
});

app.get("/thanks", (req, res) => {
    res.render("thanks", {
        title: "thanks",
        layout: "main",
    });
});

app.get("/signers", (req, res) => {
    res.render("signers", {
        title: "signers",
        layout: "main",
    });
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
