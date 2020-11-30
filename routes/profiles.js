const express = require('express');
const router = express.Router();
const db = require('../db');
const helper = require('../helpers');
const QRCode = require('qrcode');
const {
  uuid
} = require('uuidv4');

// List
router.get('/', helper.loginChecker, (req, res, next) => {
  const sqlQuery = 'SELECT * FROM `profiles` ORDER BY id';
  db.query(sqlQuery, (err, results, fields) => {
    if (err) {
      express.status(500).json(err);
      return;
    }
    res.render('siteProfile', {
      title: 'Profile',
      profiles: Buffer.from(JSON.stringify(results), 'utf8').toString("base64")
    });
  });
});

// Redirect
router.get("/u/:uuid", (req, res, next) => {
  if (!req.session.authorised) {
    res.redirect("/show/" + req.params.uuid);
    return;
  }

  const sqlQuery = db.format(`SELECT id, uuid FROM profiles WHERE uuid = ?`, [req.params.uuid]);
  db.query(sqlQuery, (err, results, fields) => {
    if (err) {
      next(new Error(err.message));
      return;
    }

    if (results.length >= 1) {
      res.redirect("/edit/" + results[0].id);
      return;
    } else {
      res.status(404);
      next(new Error("Not found"));
      return;
    }
  });
});

// Get QR Codes
router.get("/qr", helper.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin) {
    res.redirect('/');
    return;
  }

  const sqlQuery = db.format(`SELECT id, uuid, sname, fname, lname FROM profiles`);
  db.query(sqlQuery, (err, results, fields) => {
    if (err) {
      next(new Error(err.message));
      return;
    }

    Promise.all(results.map(p => QRCode.toDataURL(process.env.PROD_URL + "u/" + p.uuid, {
      margin: 0
    }).then(v => ({
      id: p.id,
      uuid: p.uuid,
      name: p.sname || p.fname || p.lname,
      data: v
    })))).then(profiles => {
      console.log(profiles.length);
      res.render("siteQr", {
        profiles: profiles
      });
    }).catch(err => {
      next(new Error(err.message));
    });
  });
});

// Edit
router.get("/edit/:id", helper.loginChecker, (req, res, next) => {
  if (!req.params.id || req.params.id <= 0) {
    const obj = {
      id: 0,
      fname: "",
      lname: "",
      sname: "",
      zombie_level: 0
    }

    res.render("editProfile", {
      title: (obj.id ? "Edit" : "Erstellen"),
      ...obj
    });
  } else {
    const sqlQuery = db.format(`SELECT * FROM profiles WHERE id = ?`, [req.params.id]);
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
        fname: results[0].fname,
        lname: results[0].lname,
        sname: results[0].sname,
        zombie_level: results[0].zombie_level,
        uuid: results[0].uuid
      }

      res.render("editProfile", {
        title: (obj.id ? "Edit" : "Erstellen"),
        ...obj
      });
    });
  }
});

// Show
router.get("/show/:uuid", (req, res, next) => {
  const sqlQuery = db.format(`SELECT * FROM profiles WHERE uuid = ?`, [req.params.uuid]);
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
      sname: results[0].sname,
      zombie_level: results[0].zombie_level,
      uuid: results[0].uuid
    }

    res.render("showProfile", {
      title: ("Profil"),
      ...obj
    });
  });
});

router.post("/edit/:id/save", helper.loginChecker, (req, res, next) => {

  const vals = [
    req.body.fname,
    req.body.lname,
    req.body.sname,
    Number(req.body.zombie_level),
    Number(req.params.id)
  ];

  const sqlSelect = db.format(`SELECT * FROM profiles WHERE id = ?`, [Number(req.params.id)]);
  db.query(sqlSelect, function (err, result) {
    if (err) {
      next(new Error(err.message));
      return;
    }
    if (result.length <= 0) {
      // Create
      const sqlCreate = db.format(`INSERT INTO profiles VALUES (null, ?, ?, ?, ?, null, uuid())`, vals);
      db.query(sqlCreate, function (err2, result2) {
        if (err2) {
          next(new Error(err2.message));
          return;
        }
        res.redirect("/");
      });
    } else if (result.length == 1) {
      // Update
      const sqlCreate = db.format(`UPDATE profiles SET fname = ?, lname = ?, sname = ?, zombie_level = ? WHERE id = ?`, vals);
      db.query(sqlCreate, function (err2, res2) {
        if (err2) {
          next(new Error(err2.message));
          return;
        }
        res.redirect("/");
      });
    } else {
      // Error
      next(new Error("Not identical"));
      return;
    }
  });
});

router.get("/delete/:id", helper.loginChecker, (req, res, next) => {
  if (!req.session.isAdmin) {
    res.redirect('/');
    return;
  }

  const sqlDel = db.format(`DELETE FROM profiles WHERE id = ?`, Number(req.params.id));
  db.query(sqlDel, function (err, results) {
    if (err) {
      next(new Error(err.message));
      return;
    }
    res.redirect("/");
  });
});

module.exports = router;