var Promise = require('bluebird');

module.exports.executeSsh = function(username, port, command) {
  var SshClient = require('ssh2').Client;
  var conn = new SshClient();
  var deferred = Promise.defer();
  var collectedOutput = "";
  conn.on('ready', function () {
    conn.exec(command, function (err, stream) {
      if (err) throw err;
      stream.on('close', function (code, signal) {
        deferred.resolve(collectedOutput);
        conn.end();
      }).on('data', function (data) {
        collectedOutput += data;
      }).stderr.on('data', function (data) {
          deferred.reject(data);
        });
    });
  })
    .on('error', function (err) {
      deferred.reject(err);
    })
    .connect({
      host: '127.0.0.1',
      port: port,
      username: username,
      privateKey: require('fs').readFileSync('/home/' + username + '/.ssh/server_to_client')
    });
  return deferred.promise;
};
