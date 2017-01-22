const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(cookieParser());
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

//input long url through form
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

//receive form data of long url
app.post("/urls", (req, res) => {
  let shortURL = randomString();
  let longURL = req.body.longURL;
  //add new key-value pair to urlDatabase
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls/" + shortURL);
});

//redirect short url to long url page
app.get("/u/:shortURL", (req, res) => {
  let templateVars = {
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.redirect(templateVars.longURL, templateVars);
});

//to show single URL from user input of shortURL to browser
//to show single URL from form of long url
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
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

//receive form data from partial header
//set cookie called username to info from form
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

//clears the cookie after pressing logout
app.post("/logout", (req, res) => {
  res.cookie("username", '');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});