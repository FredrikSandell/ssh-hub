var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Promise = require('bluebird');

var serverConfig = require('config').get('Server');

var basicAuth = require('basic-auth-connect');
//app.use(basicAuth('l948jd9jdolsJDl3LS', 'lkjfalkuf9i84y270hf92cn98234n0keq021'));
//bDk0OGpkOWpkb2xzSkRsM0xTOmxramZhbGt1ZjlpODR5MjcwaGY5MmNuOTgyMzRuMGtlcTAyMQ==
//app.use(basicAuth(serverConfig.basic_auth.username, serverConfig.basic_auth.password));
auth = basicAuth(serverConfig.basic_auth.username, serverConfig.basic_auth.password)
terminalService = require("./terminal-service.js");

/**
 * Allow the server to read raw text/plain posts
 */
app.use(function (req, res, next) {
  var contentType = req.headers['content-type'] || ''
    , mime = contentType.split(';')[0];

  if (mime != 'text/plain') {
    return next();
  }

  var data = '';
  req.setEncoding('utf8');
  req.on('data', function (chunk) {
    data += chunk;
  });
  req.on('end', function () {
    req.rawBody = data;
    next();
  });
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

var port = process.env.PORT || serverConfig.http_port;
var router = express.Router();


router.get('/terminals', auth, function (req, res) {
  terminalService.getTerminals().then(function (terminals) {
    res.json(terminals);
  }).catch(function (reason) {
    res.status(500).send(reason.toString());
  });
});

router.get('/terminals/:terminal_id', auth, function (req, res) {
  terminalService.getTerminal(parseInt(req.params.terminal_id)).then(function (terminal) {
    if (terminal == null) {
      res.status(404).send('no terminal with id "' + req.params.terminal_id + '" was found in the system');
    } else {
      res.json(terminal);
    }
  }).catch(function (reason) {
    res.status(500).send(reason.toString());
  });
});

router.delete('/terminals/dropAll', auth, function (req, res) {
  terminalService.removeAll().then(function () {
    res.send("ok");
  }).catch(function (reason) {
    res.status(500).send(reason.toString());
  });
});

router.delete('/terminals/:terminal_id', auth, function (req, res) {
  terminalService.remove(parseInt(req.params.terminal_id)).then(function () {
    res.send("ok");
  }).catch(function (reason) {
    res.status(500).send(reason.toString());
  });
});

router.post('/terminals', auth, function (req, res) {
  console.log(req.body);
  if (req.body.description == undefined) {
    res.status(501).send('No description provided');
    res.send();
    return;
  }
  var description = req.body.description;
  terminalService.create()
    .then(function (insertedTerminalData) {
      console.log('inserted: ');
      console.log(insertedTerminalData);
      res.json(insertedTerminalData);
    })
    .catch(function (error) {
      res.status(500).send(error.toString());
    });
});

router.post('/terminals/:terminal_id/run', auth, function (req, res) {
  var command = req.rawBody
  var terminal_id = req.params.terminal_id;
  console.log("will apply command \"" + JSON.stringify(command) + "\" to terminal: \"" + terminal_id + "\"");

  terminalService.run(parseInt(terminal_id), command).then(function success(runResult) {
    res.send(runResult);
  }, function error(reason) {
    if (typeof reason === terminalService.TerminalNotFoundError) {
      res.status(404).send("Terminal not found");
    } else {
      console.log(reason);
      res.status(500).send(reason.toString());
    }
  }).catch(function (error) {
    console.log("unable to execute command for terminal: " + terminal_id);
    console.log(error);
    if (typeof error === terminalService.TerminalNotFoundError) {
      res.status(404).send("Terminal not found");
    } else {
      console.log(reason);
      res.status(500).send(reason.toString());
    }
  });
});

router.get('/setup/:terminal_id', function (req, res) {
  var terminal_id = req.params.terminal_id;
  res.status(200).send(
    'echo "Fetching client setup package...";'
    +'scp -P '+serverConfig.ssh_port+' '+serverConfig.scp_username
    +'@'+serverConfig.server_addr+':/home/'+terminal_id+'/client_package.tar.gz .;'
    +'echo "Extracting client setup package...";'
    +'tar -zxvf client_package.tar.gz;'
    +'cd client_package/;'
    +'echo "Running the setup script. This will require sudo:";'
    +'sudo bash client_setup_script.sh;');
});

app.use('/', router);
app.listen(port);
console.log('Server listening on port ' + port);
