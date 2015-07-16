var exec    = require('child_process').exec;
var Promise = require('bluebird');

function execute(command, callback){
  exec(command, function(error, stdout, stderr){ callback(error, stdout+stderr); });
};

module.exports = {
  execAsync : Promise.promisify(execute)
};