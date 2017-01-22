const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  global: {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  }
};

let users = {};

function randomString() {
  let result = "";
  let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 6; i > 0; --i) {
    result += chars[Math.floor(Math.random() * 62)];
  }
  return result;
}

//called handler
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["user_id"],
    users: users
  };
  res.render("urls_index", templateVars);
});

//input long url through form
app.get("/urls/new", (req, res) => {
  if (users && users[req.cookies.user_id]) {
    let templateVars = {
      username: req.cookies["user_id"],
      users: users,
      urls: urlDatabase
    };
    res.render("urls_new", templateVars);
  }
});

//receive form data of long url
app.post("/urls", (req, res) => {
  let shortURL = randomString();
  let longURL = req.body.longURL;
  let username = req.cookies["user_id"];
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
  res.redirect("/urls");
});

//to show single URL from user input of shortURL to browser
//to show single URL from form of long url
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.cookies["user_id"]][req.params.id],
    username: req.cookies["user_id"],
    users: users,
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});

//receives form to delete
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//receieve form data and updates the new long url
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  //add updated long url
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});

//register page to new page with only form and header
app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies["user_id"],
    users: users,
    urls: urlDatabase
  };
  res.render("urls_register", templateVars);
});

//receieve form data from registration
app.post("/register", (req, res) => {
  let randomID = randomString();
  let email = req.body.email;
  let password = req.body.password;

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
      password: req.body.password
    };
    res.cookie("user_id", randomID);
  }
  res.redirect("/urls");
});

//login page
app.get("/login", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["user_id"],
    users: users,
  };
  res.render("urls_login", templateVars)
});

//receive form data from partial header
//set cookie called username to info from form
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  for (let userID in users) {
    if (email !== users[userID].email) {
      return res.status(403).send("Please Register!");
    }
    if ((email === users[userID].email) && (password !== users[userID].password)) {
      return res.status(403).send("Incorrect Password!");
    }
    if ((email === users[userID].email) && (password === users[userID].password)) {
      res.cookie("user_id", users[userID].id);
      return res.redirect("/urls");
    }
  }
});

//clears the cookie after pressing logout
app.post("/logout", (req, res) => {
  res.cookie("user_id", '');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});