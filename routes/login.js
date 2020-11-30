const express = require('express');
const router = express.Router();
const db = require('../db');
const helpers = require('../helpers');

// Register
router.get('/register', helpers.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin) {
    res.status(403)
    next(new Error("Zugriff verweigert"))
    return
  }

  res.render('editUserCreate', {
    title: 'Register'
  });
});

router.post('/register', helpers.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin) {
    res.status(403)
    next(new Error("Zugriff verweigert"))
    return
  }

  if (!helpers.checkForm([req.body.name, req.body.psw])) {
    next(new Error("Bitte alle Felder ausfüllen"));
    return;
  }

  const values = [req.body.name, req.body.psw, Number(!!req.body.isadmin)];
  const sqlQuery = db.format(`INSERT INTO users VALUES(NULL, ?, MD5(?), ?)`, values);

  db.query(sqlQuery, (err, results, fields) => {

    if (err) {
      next(new Error(err.message));
      return;
    }

    if (results.affectedRows == 1) {
      res.redirect('/');
      return;
    } else {
      next(new Error(err.message));
    }
  });
});

// Login
router.get('/login', (req, res, next) => {
  if (req.session.authorised){
    res.redirect('/');
    return;
  }
  
  res.render('siteLogin', {
    title: 'Login',
    returnUrl: req.query.returnUrl
  });
});

router.post('/login', (req, res, next) => {

  if (!helpers.checkForm([req.body.name, req.body.psw])) {
    next(new Error("Bitte alle Felder ausfüllen"));
    return;
  }

  const sqlQuery = `SELECT * FROM users WHERE name = ? AND pass = MD5(?)`;
  db.query(sqlQuery, [req.body.name, req.body.psw], (err, results, fields) => {

    if (err) {
      next(new Error(err.message));
      return;
    }

    if (results.length == 1) {
      req.session.authorised = true;
      req.session.userId = results[0].id;
      req.session.isAdmin = Boolean(results[0].isAdmin[0]);
      req.session.name = results[0].name
      res.redirect(req.body.returnUrl || '/');
      return;
    } else {
      next(new Error('Name oder Passwort stimmt nicht'));
    }
  });
});

// Reset session
router.get('/exit', helpers.loginChecker, (req, res, next) => {
  req.session.destroy(function (err) {
    res.redirect('/login');
  });
});

module.exports = router;