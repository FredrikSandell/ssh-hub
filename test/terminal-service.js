var proxyquire = require('proxyquire');
var assert = require('assert');
var db_stub = {};

var testConfiguration = {};

var config_stub = {
  get: function (configurationName) {
    assert.equal('Server', configurationName);
    return testConfiguration;
  }
};
var ssh_exec_on_terminal_stub = {};
var bash_exec_stub = {};
var bluebird_stub = {};

var Promise = require('bluebird');

//var terminal_service = require('../js/terminal-service.js');

var terminal_service = proxyquire('../js/terminal-service.js', {
  './db-provider.js': db_stub,
  './bash-exec.js': bash_exec_stub,
  './ssh-exec-on-terminal.js': ssh_exec_on_terminal_stub,
  'bluebird': bluebird_stub,
  'config': config_stub
});

describe('TerminalService', function () {
  describe('#getTerminals()', function () {
    it('should query the database for terminals', function () {
      db_stub.findAsync = function (queryObject) {
        assert.deepEqual({}, queryObject);
        return "ok";
      };
      assert.equal("ok", terminal_service.getTerminals());
    });
  });
  describe('#getTerminal()', function () {
    it('should query database for terminal with id', function () {
      db_stub.findOneAsync = function (queryObject) {
        assert.deepEqual({terminal_id: 123}, queryObject);
        return "ok";
      };
      assert.equal("ok", terminal_service.getTerminal("123"));
    });
  });
  describe('#remove()', function () {
    it('should remove terminal with provided id', function () {
      var bashAlreadyExecuted = false;
      bash_exec_stub.execAsync = function (command) {
        assert.equal('bash ../bash/remove_terminal.sh 123', command);
        bashAlreadyExecuted = true;
        return Promise.resolve(123);
      };
      db_stub.removeAsync = function (queryObject) {
        assert(bashAlreadyExecuted);
        assert.deepEqual({terminal_id: 123}, queryObject);
      };
      terminal_service.remove(123);
    });
  });
  describe('#removeAll()', function () {
    it('should remove all terminals', function () {
      db_stub.findAsync = function (queryObject) {
        assert.deepEqual({}, queryObject);
        return Promise.resolve([
          {terminal_id: 123},
          {terminal_id: 456}
        ]);
      };
      bash_exec_stub.execAsync = function (command) {
        assert(command.indexOf('bash ../bash/remove_terminal.sh ') === 0);
        return Promise.resolve();
      };
      db_stub.removeAsync = function (queryObject) {
        assert.notEqual([123, 456].indexOf(queryObject.terminal_id), -1)
        return Promise.resolve();
      };
      terminal_service.removeAll();
    });
  });
  describe('#create()', function () {
    var expectedResult = {};

    beforeEach(function () {
      testConfiguration.terminal_start_port = 50000; //this is the lower id/port number any terminal will be assigned to
      testConfiguration.server_addr = "random.com";
      testConfiguration.ssh_port = 22;

      var executedBash = false;

      expectedResult = {
        creationLog: "bash stdOut"
      };

      bash_exec_stub.execAsync = function (command) {
        assert.equal('bash ../bash/setup_new_terminal.sh ' + expectedResult.terminal_id + ' random.com 22', command);
        executedBash = true;
        return Promise.resolve("bash stdOut");
      };

      db_stub.insertAsync = function (terminalInfo) {
        assert(executedBash);
        assert.deepEqual(terminalInfo, expectedResult)
        return Promise.resolve(expectedResult);
      };
    });

    it('should create a new terminal with first available id', function () {
      expectedResult.terminal_id = 50003;
      expectedResult.username = "terminal50003";
      executedBash = false;

      db_stub.findAsync = function (queryObject) {
        assert.deepEqual({}, queryObject);
        return Promise.resolve([
          {terminal_id: testConfiguration.terminal_start_port},
          {terminal_id: testConfiguration.terminal_start_port + 1},
          {terminal_id: testConfiguration.terminal_start_port + 2},
          //3 is missing
          {terminal_id: testConfiguration.terminal_start_port + 4},
          //5 is missing
          {terminal_id: testConfiguration.terminal_start_port + 6}
        ]);
      };

      terminal_service.create().then(function (terminalInfo) {
        assert.deepEqual(terminalInfo, expectedResult);
      });
    });
    it('should create a terminal with id as terminal_start_port if none exists', function () {
      expectedResult.terminal_id = 50000;
      expectedResult.username = "terminal50000";
      executedBash = false;

      db_stub.findAsync = function (queryObject) {
        assert.deepEqual({}, queryObject);
        return Promise.resolve([]);
      };

      terminal_service.create().then(function (terminalInfo) {
        assert.deepEqual(terminalInfo, expectedResult);
      });
    });

    it('should generate an error if all terminal slots are exhausted', function () {
      expectedResult.terminal_id = 50000;
      expectedResult.username = "terminal50000";
      executedBash = false;

      db_stub.findAsync = function (queryObject) {
        assert.deepEqual({}, queryObject);
        return Promise.resolve([]);
      };

      terminal_service.create().then(function (terminalInfo) {
        assert.deepEqual(terminalInfo, expectedResult);
      });
    });
  });
  describe('#run',function() {
    it('should execute the given command if the terminal exists and return stdOut', function() {
      db_stub.findOneAsync = function (queryObject) {
        assert.deepEqual({terminal_id : 999}, queryObject);
        return Promise.resolve({
          terminal_id: 999,
          username: "terminal999"
        });
      };
      ssh_exec_on_terminal_stub.executeSsh = function(username, port, command) {
        assert.equal(username, 'terminal999');
        assert.equal(port, 999);
        assert.equal(command, 'bash echo "1"');
        return Promise.resolve("1")
      };
      terminal_service.run(999,'bash echo "1"').then(function(stdOut) {
        assert.equal(stdOut, '1');
      });
    });
    it('should return error if terminal does not exist', function() {
      db_stub.findOneAsync = function (queryObject) {
        assert.deepEqual({terminal_id : 999}, queryObject);
        return Promise.resolve(null);
      };
      //bluebird thinks that the thrown error in the "run" method remains unhandled. that is not the case
      //we assign a custom handler for this to prevent stack traces in the test output
      Promise.onPossiblyUnhandledRejection(function(error){
        throw error;
      });

      terminal_service.run(999,'bash echo "1"').then(function(stdOut) {
        assert(false,'Should not resolve id terminal does not exist');
      }).catch(terminal_service.TerminalNotFound ,function(error) {

      }).catch(function(error) {
        assert(false,'Should not be rejected with this: '+error)
      }).done(); //done is needed here to propagate any assertion errors in the catch functions to mocha
      terminal_service.run(999, 'anything');
    });
  })
});