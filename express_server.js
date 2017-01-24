const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

let urlDatabase = {};

let users = {};

function randomString() {
  let result = "";
  let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 6; i > 0; --i) {
    result += chars[Math.floor(Math.random() * 62)];
  }
  return result;
}

app.get("/", (req, res) => {
  if (users && users[req.session.user_id]) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

//called handler
app.get("/urls", (req, res) => {
  if (users && users[req.session.user_id]) {
    res.status(200);
    let templateVars = {
      urls: urlDatabase,
      username: req.session.user_id,
      users: users
    };
    res.render("urls_index", templateVars);
  }
  res.status(401).send("Please Sign In: http://localhost:8080/login");
});

//input long url through form
app.get("/urls/new", (req, res) => {
  if (users && users[req.session.user_id]) {
    res.status(200);
    let templateVars = {
      username: req.session.user_id,
      users: users,
      urls: urlDatabase
    };
    res.render("urls_new", templateVars);
  }
  res.status(401).send("Please Sign In: http://localhost:8080/login")
});

//receive form data of long url
app.post("/urls", (req, res) => {
  let shortURL = randomString();
  let longURL = req.body.longURL;
  let username = req.session.user_id;
  //add new key-value pair to urlDatabase
  if (urlDatabase[username] === undefined) {
    urlDatabase[username] = {};
    urlDatabase[username][shortURL] = longURL;
  }
  urlDatabase[username][shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});

//redirect short url to long url page
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  for (let user in urlDatabase) {
    if (urlDatabase[user][shortURL]) {
      return res.redirect(urlDatabase[user][shortURL]);
    }
  }
  res.status(404).send("Short URL does not exist!");
});

//to show single URL from user input of shortURL to browser
//to show single URL from form of long url
app.get("/urls/:id", (req, res) => {
  let userID = req.session.user_id;
  let shortURL = req.params.id;
  let longURL = urlDatabase[userID][shortURL];

  console.log(urlDatabase);
  if (userID === '') {
      return res.status(401).send("Please Sign In: http://localhost:8080/login");
  }


  for (let user in urlDatabase) {

    if (user !== userID && urlDatabase[user][shortURL]) {
      return res.status(403).send("This is not your URL!");
    }
  }

  if (longURL === undefined) {
    return res.status(404).send("Short URL does not exist!");
  }
  res.status(200);
  let templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[userID][shortURL],
    username: userID,
    users: users,
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});

//receives form to delete
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.session.user_id][req.params.id];
  res.redirect("/urls");
});

//receieve form data and updates the new long url
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  //add updated long url
  urlDatabase[req.session.user_id][shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});

//register page to new page with only form and header
app.get("/register", (req, res) => {
  let templateVars = {
    username: req.session.user_id,
    users: users,
    urls: urlDatabase
  };
  res.render("urls_register", templateVars);
});

//receieve form data from registration
app.post("/register", (req, res) => {
  let randomID = randomString();
  let email = req.body.email;
  const password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);

  for (let userID in users) {
    if (email === users[userID].email) {
      return res.status(400).send("You are already registered!");
    }
  }

  if (email === '' || password === '') {
    res.status(400).send("Not valid!");
  } else {
    users[randomID] = {
      id: randomID,
      email: req.body.email,
      password: hashed_password
    };
    req.session.user_id = randomID;
  }
  res.redirect("/urls");
});

//login page
app.get("/login", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.session.user_id,
    users: users,
  };
  res.render("urls_login", templateVars)
});

//receive form data from partial header
//set cookie called username to info from form
app.post("/login", (req, res) => {
  let email = req.body.email;
  const password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);

  for (let userID in users) {
    if (email !== users[userID].email) {
      return res.status(403).send("Please Register!");
    }
    if ((email === users[userID].email) && !bcrypt.compareSync(password, hashed_password)) {
      return res.status(403).send("Incorrect Password!");
    }
    if ((email === users[userID].email) && bcrypt.compareSync(password, hashed_password)) {
      req.session.user_id = users[userID].id;
      return res.redirect("/urls");
    }
  }
});

//clears the cookie after pressing logout
app.post("/logout", (req, res) => {
  req.session.user_id = '';
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});