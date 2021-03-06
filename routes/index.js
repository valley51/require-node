var express = require('express');
var dbDept = require('../db/dept.js');
var dbMessage = require('../db/message.js');
var dbCates = require('../db/cates.js');
var dbUser = require('../db/user.js');
var myUtil = require('../util/myUtil.js');
var router = express.Router();
var util = require('util');
var upload = require('../util/multerUpload.js');
var statusCovert = require('../util/statusCovert.js');
var config = require('../db/config.js');

/* 传输消息参数，获取add页面 */
function getAddPage(res, message) {
  dbCates.getAllCates(function (errs2, rows2) {
    dbCates.getkeysByCate('IT', function (errs3, rows3) {
      if (!errs2 && !errs3) {
        res.render('add', {
          title: '添加需求',
          message: message,
          cates: rows2,
          keys: rows3,
          plant: config.plant
        });
      } else {
        next();
      }
    });
  });
}

/* 传输消息参数，获取首页 */
/*function getIndexPage(res, message, pageCount) {
 dbMessage.getMessagesByPage(pageCount, function (errs, rows) {
 dbCates.getAllCates(function (errs2, rows2) {
 if (!errs && !errs2) {
 res.render('index', {
 title: '需求首页',
 message: message,
 cates: rows2,
 messages: rows
 });
 } else {
 next();
 }
 });
 });
 }*/

/* GET Home by status */
/*router.get('/status/:status', function (req, res, next) {
 var status = req.params.status;
 var page = (typeof (req.query.page) == 'undefined') ? 1 : req.query.page;
 dbMessage.getMessagesByStatus(page, status, function (errs, rows) {
 if (!errs) {
 var subtitle = statusCovert.fromIdToComment(status * 1);
 console.log("---------------------------------2" + subtitle);
 res.render('index/index-ajax-status', {
 subtitle: subtitle,
 messages: rows
 });
 } else {
 next();
 }
 });
 });*/

/* ----------------- BEGIN Ajax ----------------------*/
/* GET keys by cate in add page */
router.get('/ajax/:cate', function (req, res, next) {
  var cate = req.params.cate;
  dbCates.getkeysByCate(cate, function (errs, rows) {
    res.render('index/ajax-add-keys', {
      cate: cate,
      keys: rows
    });
  });
});

/* GET dept by plant in add page */
router.get('/ajax/dept/:plant', function (req, res, next) {
  var plant = req.params.plant;
  dbDept.findAllDepts(plant, function (errs, rows) {
    if (!errs) {
      res.json(rows);
    } else {
      next();
    }
  });
});

/* GET others data in index page*/
router.get('/ajax/others/:id', function (req, res, next) {
  var id = req.params.id;
  dbMessage.getMessageById(id, function (errs, rows) {
    if (!errs && rows) {
      var images = rows[0].image.split(',');
      var content = rows[0].content;
      var reContent = rows[0].reContent;
      res.render('index/ajax-index-others.ejs', {
        content: content,
        images: images,
        reContent: reContent
      });
    } else {
      next();
    }
  });
});
/* POST up a message in index page */
router.post('/ajax/up/:id', function (req, res, next) {
  var id = req.params.id * 1;
  dbMessage.upMessage(id, function (errs, rows) {
    if (!errs) {
      res.end('success');
    } else {
      res.end('error');
    }
  });
});

/* POST cancel up a message in index page */
router.post('/ajax/cancel/:id', function (req, res, next) {
  var id = req.params.id;
  dbMessage.downMessage(id, function (errs, rows) {
    if (!errs) {
      res.end('success');
    } else {
      res.end('error');
    }
  });
});

/* ----------------- END Ajax ----------------------*/

/* GET home page. */
router.get('/', function (req, res, next) {
  var page = (typeof (req.query.page) == 'undefined') ? 1 : req.query.page;
  console.log(page);
  dbMessage.getMessages(page, function (errs, rows) {
    dbCates.getAllCates(function (errs2, rows2) {
      dbMessage.getCountFromMessage(function (errs3, rows3) {
        if (!errs && !errs2 && !errs3) {
          res.render('index', {
            title: '需求首页',
            cates: rows2,
            messages: rows,
            category: null,
            count: rows3[0].count,
            page: page
          });
        } else {
          next();
        }
      });
    });
  });
});

/* GET Home by category */
router.get('/cate/:cate', function (req, res, next) {
  var cate = req.params.cate;
  var page = (typeof (req.query.page) == 'undefined') ? 1 : req.query.page;
  dbMessage.getMessagesByCate(page, cate, function (errs, rows) {
    dbCates.getAllCates(function (errs2, rows2) {
      dbMessage.getCountFromMessageByCate(cate, function (errs3, rows3) {
        if (!errs && !errs2 && !errs3) {
          res.render('index', {
            title: '需求首页',
            cates: rows2,
            messages: rows,
            category: cate,
            count: rows3[0].count,
            page: page
          });
        } else {
          next();
        }
      });
    });
  });
});

/* GET add page. */
router.get('/add', function (req, res, next) {
  getAddPage(res, '');
});

/*  add requirement. */
router.post('/add', upload.array('image'), function (req, res, next) {
  console.log(util.inspect(req.files));
  console.log(util.inspect(req.body));
  var category = req.body.cate;
  var keyname = req.body.key;
  var title = req.body.title.trim();
  var content = req.body.content.toString().trim();
  var dept = req.body.dept;
  var image = [];
  for (var i = 0; i < req.files.length; i++) {
    image.push(req.files[i].filename);
  }
  var user = myUtil.getIp(req);
  var time = myUtil.getTime(new Date());
  var status = 1;
  var upNum = 1;
  console.log("..................................add message: %s,%s,%s,%s,%s,%s,%d.", category, keyname, content, dept, user, time, status);
  if (keyname && title && dept) {
    dbMessage.addMessage(category, keyname, title, content, dept, time, user, status, image, upNum, function (errs, rows) {
      if (!errs) {
        res.redirect('/');
      } else {
        res.render('err', {
          message: errs,
          error: errs
        });
      }
    });
  } else {
    getAddPage(res, '请填写完整');
  }
});

/* GET login page */
router.get('/login', function (req, res, next) {
  res.render('login', {
    message: ''
  });
});

/* POST log in */
router.post('/login', function (req, res, next) {
  var username = req.body.username;
  var password = req.body.passwd;
  console.log('username: ' + username + '\npassword: ' + password);
  if (username && password) {
    dbUser.valideUser(username, function (errs, rows) {
      console.log('errs:' + errs + '\nrows :' + rows[0]);
      if (!errs) {
        if (rows[0] && rows[0].password && password == rows[0].password) {
          console.log('登陆成功');
          req.session.username = username;
          res.redirect('/admin');
        } else {
          res.render('login', {
            message: '用户名密码错误'
          });
        }
      } else {
        next();
      }
    })
  } else {
    res.render('login', {
      message: '请填写完整'
    });
  }
});

/* POST logout */
router.get('/logout', function (req, res, next) {
  if (req.session.username) {
    req.session.username = null;
  }
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
