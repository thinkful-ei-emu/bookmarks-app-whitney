require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const bookmarkRouter = require('./bookmarks/bookmarks-router');
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');
const { NODE_ENV } = require('./config');

// ========== INSTANTIATE APP ==========
const app = express();

// ========== MIDDLEWARE ==========
app.use(morgan((NODE_ENV === 'production') ? 'common' : 'dev'));
app.use(cors());
app.use(helmet());

// ========== AUTHENTICATION ==========
app.use(validateBearerToken);

// ========== ROUTER ==========
app.use('/bookmarks', bookmarkRouter);

// ========== ERROR HANDLING ==========
app.use(errorHandler);

module.exports = app;