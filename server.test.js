const supertest = require("supertest");
const { app } = require("./server");
const cookieSession = require("cookie-session");

// console.log("app in server.test.js: ", app);
test("GET /petition sends 200 status code as a response", () => {
    return supertest(app)
        .get("/petition")
        .then((res) => {
            // console.log('response', res);
            // console.log("response", res.statusCode);
            expect(res.statusCode).toBe(200);
        });
});

test("POST /petition redirects to /thanks", () => {
    cookieSession.mockSessionOnce({
        signatureId: true,
    });
    return supertest(app)
        .post("/petition")
        .then((res) => {
            // expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        });
});

test.only("GET / petition sends 200 if there is a cookie", () => {
    cookieSession.mockSessionOnce({
        userId: true,
        loggedIn: true,
        signatureId: true,
    });
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(200);
        });
});

test("GET /home sends 302 when there is NO cookie", () => {
    cookieSession.mockSessionOnce({});

    return supertest(app).get(
        "/home".then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        })
    );
});

test("GET /home sends 200 if there IS a cookie", () => {
    cookieSession.mockSessionOnce({
        submitted: true,
    });
    return supertest(app)
        .get("/home")
        .then((res) => {
            expect(res.statusCode).toBe(200);
        });
});
