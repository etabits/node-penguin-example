#!/usr/bin/env node
'use strict';
const mongoose = require('mongoose');
const async = require('async');

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/penguin');

const IDs = [mongoose.Types.ObjectId(), mongoose.Types.ObjectId()];

const Seeds = {
  Node: [
    {
      type: 'p',
      published: true,
      user: IDs[0],
      date: new Date(),
      title: 'About',
      content: 'We are simple the best, and the most humble, there is...'
    }, {
      type: 'p',
      published: false,
      user: IDs[1],
      date: new Date(),
      title: 'History',
      content: 'Since the big bang...'
    }, {
      type: 'a',
      published: true,
      user: IDs[0],
      date: new Date(),
      title: 'Welcome',
      content: 'Welcome to our new home...'
    }
  ],
  User: [
    {
      _id: IDs[0],
      username: 'Master',
      email: 'master@example.org',
      password: 'plaintextpass',
      isAdmin: true,
      data: {
        alternateEmail: 'master2@example.org'
      },
      meta: {
        slug: 'admin-master',
        settings: {
          hasLoggedOn: false,
          lastLoginDate: Date.now()
        },
        deepMeta: {
          deepSlug: 'deep-admin-master'
        }
      },
      tags: ['admin', 'master', 'keyMaster']
    }, {
      _id: IDs[1],
      username: 'Peon',
      email: 'peon@example.org',
      password: 'usebcrypttostorepasswords!',
      isAdmin: false
    }
  ]
};

const now = Date.now();

let c, i;
for (c = i = 1; i <= 100; c = ++i) {
  Seeds.Node.push({
    type: 'a',
    user: Math.random() > 0.5 ? IDs[0] : IDs[1],
    title: "Article " + c,
    content: "Content for article " + c,
    date: new Date(now + 1000 * c),
    published: Math.random() > 0.5
  });
}

const createSeeder = function(modelName) {
  return function(done) {
    var model;
    model = mongoose.models[modelName];
    return model.remove(function() {
      return model.create(Seeds[modelName], function(err) {
        console.log('Inserted', arguments.length - 1, modelName, 'documents for testing purposes.');
        return done(err);
      });
    });
  };
};

require('coffee-script/register');

const tasks = [];
for (const modelName in Seeds) {
  require("./models/" + (modelName.toLowerCase()));
  tasks.push(createSeeder(modelName));
}

async.parallel(tasks, function(err) {
  if (err) {
    console.log('Error', err);
  }
  return mongoose.disconnect();
});
