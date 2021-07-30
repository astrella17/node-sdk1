var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// npm install cors --save
var cors = require('cors'); //CORS 추가

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var eventRouter = require('./routes/event'); 
var apiRouter = require('./routes/api');
var boardRouter = require('./routes/board');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());  //CORS추가

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/board', boardRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter); 

app.use(function(req, res, next) {
  next(createError(404));
});


app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;