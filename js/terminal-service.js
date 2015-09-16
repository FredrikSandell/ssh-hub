var db = require("./db-provider.js");
var serverConfig = require('config').get('Server');
var sshTerminalAsync = require("./ssh-exec-on-terminal.js");
var bash = require("./bash-exec.js");
var Promise = require('bluebird');

function removeTerminal(terminal_id) {
  return bash.execAsync('bash ../bash/remove_terminal.sh ' + terminal_id)
    .then(function () {
      return db.removeAsync({terminal_id: terminal_id});
    });
}

function getFirstAvailablePort() {
  return db.findAsync({}).then(function(terminals) {
    var ports = [];
    for(var i = 0; i<terminals.length; i++) {
      ports.push(terminals[i].terminal_id);
    }
    if(ports.length > serverConfig.terminal_limit) {
      throw new TerminalLimitReachedError();
    }

    ports = ports.sort();
    //find the first available port between terminal_start_port and terminal_start_port + terminal_limit
    for(var i = 0; i<ports.length; i++) {
      if(ports[i] != serverConfig.terminal_start_port+i) {
        return i+serverConfig.terminal_start_port;
      }
    }
    return ports.length+serverConfig.terminal_start_port;
  });
}

function TerminalLimitReachedError() {

}
TerminalLimitReachedError.prototyoe = Object.create(Error.prototype);

function TerminalNotFound() {}
TerminalNotFound.prototype = Object.create(Error.prototype);

function MyCustomError() {}
MyCustomError.prototype = Object.create(Error.prototype);

var terminal_service = {

  TerminalNotFound: TerminalNotFound,
  TerminalLimitReached: TerminalLimitReachedError,

  getTerminals: function () {
    return db.findAsync({});
  },

  getTerminal: function (terminalId) {
    db.findOneAsync({terminal_id : 40012}).then(function(terminal) {
      console.log(terminal);
    });
    return db.findOneAsync({terminal_id: terminalId});
  },

  removeAll: function () {
    var toBeRemoved = [];
    db.findAsync({}).then(function (terminals) {
      terminals.forEach(function (terminal) {
        toBeRemoved.push(removeTerminal(terminal.terminal_id));
      });
    });
    return Promise.settle(toBeRemoved);
  },

  remove: function (terminalId) {
    return removeTerminal(terminalId);
  },

  create: function () {
    console.log("creating");
    return getFirstAvailablePort().then(function (port) {
      console.log("First available port is: "+port);
      return {
        terminal_id: port,
        username: 'terminal' + port
      };
    }).then(function (terminalData) {
      console.log("about to execute: bash ./bash/setup_new_terminal.sh " + terminalData.terminal_id + " " + serverConfig.server_addr + " " + serverConfig.ssh_port);
      return bash.execAsync('bash ./bash/setup_new_terminal.sh ' + terminalData.terminal_id + " " + serverConfig.server_addr + " " + serverConfig.ssh_port)
        .then(function (stdOut) {
          console.log("done executing");
          console.log(stdOut);
          terminalData.creationLog = stdOut;
          db.insertAsync(terminalData);
          return terminalData;
        })
    });
  },

  run: function (terminalId, command) {
    return db.findOneAsync({terminal_id: terminalId}).then(function (terminal) {
      if (terminal == null) {
        console.log("No terminal found");
        throw new terminal_service.TerminalNotFound();
      } else {
        var username = terminal.username;
        var terminalPort = terminal.terminal_id;
        return sshTerminalAsync.executeSsh(username, terminalPort, command);
      }
    });
  }
};
module.exports = terminal_service;
