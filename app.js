require('dotenv').config()

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const sessionFileStore = require('session-file-store');
const logger = require('morgan');
const debug = require('debug')('node-relo:server');
const http = require('http');

const usersRouter = require('./routes/users');
const profilesRouter = require('./routes/profiles');
const loginRouter = require('./routes/login');
const { env } = require('process');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.pretty = true;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: env.process.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new (sessionFileStore(session))({
    path: "./sessions",
    ttl: 604800 // one week in sec
  })
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use('/', usersRouter);
app.use('/', profilesRouter);
app.use('/', loginRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  debug('Listening on ' + bind);
}

const port = process.env.PORT;
app.set('port', port);

const server = http.createServer(app);
server.on('error', onError);
server.on('listening', onListening);

server.listen(port, () => {
  console.log("\x1b[0m%s\x1b[4m\x1b[36m%s\x1b[0m", "Webpage reachable under: ", `http://localhost:${port}/`);
});