var Promise    = require('bluebird');
var dbConfig = require('config').get('Db.config');

var Datastore = require('nedb')
  , db = new Datastore({ filename: dbConfig.file_name, autoload: true });
Promise.promisifyAll(db);

module.exports = db;