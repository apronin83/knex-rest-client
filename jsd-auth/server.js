const fs = require("fs");
const bodyParser = require("body-parser");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");

const server = jsonServer.create();
const router = jsonServer.router("./jsd-auth/db.json");
const userdb = JSON.parse(fs.readFileSync("./jsd-auth/users.json", "UTF-8"));

//-------------------------------------------------------
// OLD

//server.use(bodyParser.urlencoded({extended: true}))
//server.use(bodyParser.json())
//server.use(jsonServer.defaults());

//-------------------------------------------------------
// NEW

// Create application/json parser
const jsonParser = bodyParser.json();

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({
  extended: true
});

//-------------------------------------------------------

const PORT = 5000;

const SECRET_KEY = "123456789";

const expiresIn = "1h";

// Create a token from a payload
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, {
    expiresIn
  });
}

// Verify the token
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) =>
    decode !== undefined ? decode : err
  );
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
  return (
    userdb.users.findIndex(
      user => user.email === email && user.password === password
    ) !== -1
  );
}

function findUser({ email, password }) {
  return userdb.users.find(
    user => user.email === email && user.password === password
  );
}

//----------------------------------------------------------------------
// Custom routing

// Add this before server.use(router)
server.use(
  jsonServer.rewriter({
    "/api/crud/crm/*": "/$1",
    "/api/crm/*": "/$1",
    "/api/demo/*": "/$1",
    "/blog/:resource/:id/show": "/:resource/:id"
  })
);

//----------------------------------------------------------------------

/* ORIGINAL
server.post("/auth/login", jsonParser, (req, res) => {
const { email, password } = req.body;
if (isAuthenticated({ email, password }) === false) {
const status = 401;
const message = "Incorrect email or password";
res.status(status).json({ status, message });
return;
}
const access_token = createToken({ email, password });
res.status(200).json({ access_token });
});
 */

server.post(/^\/api\/auth\/login$/, urlencodedParser, (req, res) => {
  //console.log("Body: " + JSON.stringify(req.body));

  const { email, password } = req.body;

  if (
    isAuthenticated({
      email,
      password
    }) === false
  ) {
    const status = 401;
    const message = "Incorrect email or password";
    res.status(status).json({
      status,
      message
    });
    return;
  }

  const access_token = createToken({
    email,
    password
  });

  const find_user = findUser({
    email,
    password
  });

  res.status(200).json({
    token: access_token,
    user: {
      name: find_user.name,
      email: find_user.email,
      active: 1
    },
    permissions: ["CRM"]
  });
});

//----------------------------------------------------------
// Необходимо реализовать поиск
server.post(/^\/people\/search$/, urlencodedParser, (req, res) => {
  // Вручную созданная рыба для ответа
  res.status(200).json({
    current_page: 1,
    data: [
      {
        id: 1,
        firstname: "И",
        lastname: "Ф",
        distinction: "О",
        sex_id: 3,
        language_id: 2,
        email: "aaa@sss.ru",
        phone: "123456",
        active: 1,
        created_at: null,
        updated_at: null,
        sexes_id: 3,
        sex: {
          id: 3,
          name: "Male",
          code: "M",
          eng_name: "Male",
          eng_code: "M",
          priority: 3,
          active: 1,
          created_at: null,
          updated_at: null
        },
        languages_id: 2,
        language: {
          id: 2,
          name: "Russian",
          priority: 1,
          active: 1,
          created_at: null,
          updated_at: null
        },
        fullname: "Ф И О",
        positions: [
          {
            id: 1,
            company: 1,
            person: 1,
            name: "position name",
            email: "email@email.ru",
            phone: "1234567890",
            task: 1,
            email_2: "email_2@email_2.ru",
            phone_2: "0987654321",
            phone_3: "0987654321",
            comment: "position comment",
            active: 1,
            created_at: "2019-03-12T15:21:30.759Z",
            updated_at: "2019-05-08T15:32:54.759Z"
          }
        ],
        comments: [
          {
            id: 1,
            person: 1,
            user: 1,
            userEmail: "",
            commentType: 1,
            content: "Bla-bla-bla"
          },
          {
            "person_comment_type_id": "1",
            "content": "texttexttext",
            "person_id": "1",
            "active": 1,
            "created_at": "2019-06-10T12:39:12.507Z",
            "updated_at": "2019-06-10T12:39:12.507Z",
            "status": 0,
            "id": 3
          }
        ]
      }
    ],
    from: 1,
    last_page: 1,
    next_page_url: "http://localhost:5000/api/crm/people/search?page=2",
    path: "http://localhost:5000/api/crm/people/search",
    per_page: "20",
    prev_page_url: null,
    to: 20,
    total: 4
  });
});

//----------------------------------------------------------

/* ORIGINAL
// Любой Url не содержащий в себе "/auth"
server.use(/^(?!\/auth).*$/, (req, res, next) => {
if (
req.headers.authorization === undefined ||
req.headers.authorization.split(" ")[0] !== "Bearer"
) {
const status = 401;
const message = "Error in authorization format";
res.status(status).json({ status, message });
return;
}
try {
verifyToken(req.headers.authorization.split(" ")[1]);
next();
} catch (err) {
const status = 401;
const message = "Error access_token is revoked";
res.status(status).json({ status, message });
}
});
 */

server.use(/^(?!\/api\/auth\/login).*$/, (req, res, next) => {
  if (req.originalUrl.startsWith("/api/demo/tasks")) {
    next();
    return;
  }

  console.log("URL: " + req.originalUrl);
  console.log("BER: " + req.headers.authorization);

  if (
    req.headers.authorization === undefined ||
    req.headers.authorization.split(" ")[0] !== "Bearer"
  ) {
    const status = 401;
    const message = "Error in authorization format";
    res.status(status).json({
      status,
      message
    });
    return;
  }
  try {
    verifyToken(req.headers.authorization.split(" ")[1]);

    console.log("NEXT");

    next();
  } catch (err) {
    const status = 401;
    const message = "Error access_token is revoked";
    res.status(status).json({
      status,
      message
    });
  }
});

//----------------------------------------------------------
// Add only for "vue-crud" and "vue-crud-2"

server.use(urlencodedParser, (req, res, next) => {
  console.log("METHOD: " + req.method);
  console.log("BODY: " + JSON.stringify(req.body));

  if (
    (req.method === "POST" || req.method === "PUT") &&
    !req.originalUrl.startsWith("/api/crm/people/search")
  ) {
    console.log("METHODS IN POST OR PUT");

    req.body.active = req.body.active !== undefined ? req.body.active : 1;
    req.body.created_at =
      req.body.created_at !== undefined
        ? req.body.created_at
        : new Date().toJSON(); //Date.now();
    req.body.updated_at =
      req.body.updated_at !== undefined
        ? req.body.updated_at
        : new Date().toJSON(); //Date.now();
    /*
		Status:
		0  - Ok
		-1 - Other error
		-2 - Error Validation
		 */
    req.body.status = 0;
  }
  // Continue to JSON Server router
  next();
});

//----------------------------------------------------------
// Add only for "vue-crud"

server.get(/^\/api\/auth\/user$/, (req, res) => {
  console.log("INNER USER");

  res.status(200).json({});
});

//----------------------------------------------------------
// Add only for "vue-crud-2"

//localhost:5000/api/demo/tasks
/*
http: server.get(/^\/api\/demo\/tasks.*$/, (req, res) => {
console.log("INNER USER");

res.status(200).json({});
});
 */
//----------------------------------------------------------

server.use(router);

server.listen(PORT, () => {
  console.log("Run Auth API Server - localhost:" + PORT);
});
