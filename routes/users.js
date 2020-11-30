const express = require('express');
const router = express.Router();
const db = require('../db');
const helper = require('../helpers');

// List
router.get('/user', helper.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin) {
    res.redirect('/');
    return;
  }

  const sqlQuery = 'SELECT * FROM `users` ORDER BY id';
  db.query(sqlQuery, (err, results, fields) => {
    if (err) {
      express.status(500).json(err);
      return;
    }
    res.render('siteUser', {
      title: 'Nutzer',
      users: Buffer.from(JSON.stringify(results.map(x => ({
        id: x.id,
        name: x.name,
        isadmin: x.isAdmin[0] === 1
      })))).toString("base64")
    });
  });
});

// Edit
router.get("/user/edit/:id", helper.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin) {
    res.redirect('/');
    return;
  }

  if (!req.params.id || req.params.id <= 0) {
    const obj = {
      id: 0,
      name: "",
      isadmin: false,
    }

    res.render("editUser", {
      title: "Erstellen",
      ...obj
    });
  } else {
    const sqlQuery = db.format(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
    db.query(sqlQuery, (err, results, fields) => {
      if (err) {
        next(new Error(err.message));
        return;
      }
      if (results.length <= 0) {
        res.status(404);
        next(new Error("Not found"));
        return;
      }

      obj = {
        id: results[0].id,
        name: results[0].name,
        isadmin: results[0].isAdmin[0] === 1
      }

      res.render("editUser", {
        title: "Edit",
        ...obj
      });
    });
  }
});

router.post("/user/edit/:id/save", helper.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin) {
    res.redirect('/');
    return;
  }

  if (!req.params.id || req.params.id <= 0) {
    next(new Error("Invalid id"));
    return;
  }

  const vals = [
    req.body.name,
    Number(req.params.id)
  ];

  const sqlSelect = db.format(`SELECT * FROM users WHERE id = ?`, [Number(req.params.id)]);
  db.query(sqlSelect, function (err, result) {
    if (err) {
      next(new Error(err.message));
      return;
    }
    if (result.length <= 0) {
      // Create
      const sqlCreate = db.format(`INSERT INTO users VALUES (null, ?)`, vals);
      db.query(sqlCreate, function (err2, result2) {
        if (err2) {
          next(new Error(err2.message));
          return;
        }
        res.redirect("/user");
      });
    } else if (result.length == 1) {
      // Update
      const sqlCreate = db.format(`UPDATE users SET name = ? WHERE id = ?`, vals);
      db.query(sqlCreate, function (err2, res2) {
        if (err2) {
          next(new Error(err2.message));
          return;
        }
        res.redirect("/user");
      });
    } else {
      // Error
      next(new Error("Not identical"));
      return;
    }
  });
});

router.get("/user/delete/:id", helper.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin) {
    res.redirect('/');
    return;
  }

  const sqlDel = db.format(`DELETE FROM users WHERE id = ?`, Number(req.params.id));
  db.query(sqlDel, function (err, results) {
    if (err) {
      next(new Error(err.message));
      return;
    }
    res.redirect("/user");
  });
});

// Edit Pw
router.get("/user/editPw/", helper.loginChecker, (req, res, next) => {
  res.redirect("/user/editPw/" + req.session.userId);
});

router.get("/user/editPw/:id", helper.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin && req.params.id !== (req.session.userId + "")) {
    res.redirect('/');
    return;
  }

  const sqlQuery = db.format(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
  db.query(sqlQuery, (err, results, fields) => {
    if (err) {
      next(new Error(err.message));
      return;
    }
    if (results.length <= 0) {
      res.status(404);
      next(new Error("Not found"));
      return;
    }

    obj = {
      id: results[0].id,
      name: results[0].name,
    }

    res.render("editUserPw", {
      title: "Passwort Aendern",
      ...obj
    });
  });
});

router.post("/user/editPw/:id/save", helper.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin && req.params.id !== (req.session.userId + "")) {
    res.redirect('/');
    return;
  }

  const vals = [
    req.body.psw,
    Number(req.params.id)
  ];

  const sqlSelect = db.format(`SELECT * FROM users WHERE id = ?`, [Number(req.params.id)]);
  db.query(sqlSelect, function (err, result) {
    if (err) {
      next(new Error(err.message));
      return;
    }
    if (result.length <= 0) {
      res.status(404);
      next(new Error("Not found"));
      return;
    } else if (result.length == 1) {
      // Update
      const sqlCreate = db.format(`UPDATE users SET pass = MD5(?) WHERE id = ?`, vals);
      db.query(sqlCreate, function (err2, res2) {
        if (err2) {
          next(new Error(err2.message));
          return;
        }
        res.redirect("/user");
      });
    } else {
      // Error
      next(new Error("Not identical"));
      return;
    }
  });
});

module.exports = router;