#!/usr/bin/env node
'use strict';
const path = require('path');
const express = require('express');
require('coffee-script/register');
const penguin = require('penguin');


var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/penguin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const app = express();

const developmentMode = app.get('env') === 'development';

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

try {
  const cookieParser = require('cookie-parser');
  const session = require('express-session');
  const flash = require('connect-flash');

  console.log('Enabling flash messages');
  app.use(cookieParser('topsecret00:07'));
  app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'topsecret00:07',
    cookie: {
      maxAge: 60000
    }
  }));
  app.use(flash());
} catch (error) {
  console.log('Not enabling flash messages because:');
  console.log(error);
}


if (developmentMode) {
  app.use(require('less-middleware')(path.join(__dirname, 'public')));
  app.use(require('coffee-middleware')({
    src: __dirname + '/public'
  }));
  app.use(express["static"](path.join(__dirname, 'public')));
}

if (developmentMode) {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
    console.log(err);
    return console.log(err.stack);
  });
} else {
  app.use(function(err, req, res, next) {
    res.set('Content-Type', 'text/plain');
    res.send(500, 'Error');
    return console.log('ERROR', new Date(), err, err.stack);
  });
}


const admin = new penguin.Admin({
  debug: (...args)=> console.log(...args),
  fileManager: false,
  indexTitle: 'Administration Home!',
  vModels: {
    pages: {
      base: 'Node',
      conditions: {
        type: 'p'
      }
    },
    articles: {
      base: 'Node',
      conditions: {
        type: 'a'
      }
    },
    // users: { base: 'User' }
  },
  menuExtraHTML: '<ul class="nav navbar-nav navbar-right"> <li> <a href="javascript:alert(\'Fake Logout link :)\')">Log Out</a> </li> </ul>',
  menu: [
    ['Administration Home', '/admin'],
    ['Sections', [
      ['Articles', '/admin/articles'],
      ['Pages', '/admin/pages'],
      ['Users', '/admin/users']
    ]]
  ],
  uploadHandler: function(req, res, next) {
    console.log('ignoring file upload...'); return next();
    return penguin.fileManager.save(req.files.upload, function(err, file) {
      return res.send("<script type='text/javascript'> window.parent.CKEDITOR.tools.callFunction(" + req.query.CKEditorFuncNum + ", '/" + file.path + "', 'Success!'); </script>");
    });
  },
  preMiddleware: function(req, res, next) {
    console.log('Administration Request:', req.url, req.$p);
    return next();
  },
  beforeMiddleware: function(req, res, next) {
    console.log('beforeMiddleware', req.url, Object.keys(req.$p));
    res.locals.breadcrumbs = [['/admin/', 'Home']];
    if (res.locals.model) {
      res.locals.breadcrumbs.push(['', res.locals.model.label]);
    }
    res.$p.viewBlocks['layout.above_content'] = '<div class="clearfix">Welcome to <strong>Penguin</strong> Automated Administration Panel!</div>';
    return next();
  }
});

admin.resLocals.statics.js.push('//cdn.ckeditor.com/4.4.4/standard/ckeditor.js');

admin.setupApp(app);
const port = process.env.PORT || 3000;
app.listen(port, function (argument) {
  console.log('http://localhost:'+port+'/admin/');
})
