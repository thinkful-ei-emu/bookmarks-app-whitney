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
// third party that applies to all paths
app.use(morgan((NODE_ENV === 'production') ? 'common' : 'dev'));
app.use(cors());
app.use(helmet());

// ========== AUTHENTICATION ==========
// applies to all paths
app.use(validateBearerToken);

// ========== ROUTER ==========
// applies to /bookmarks path
app.use('/api/bookmarks', bookmarkRouter);

// ========== ERROR HANDLING ==========
// applies to all paths
app.use(errorHandler);

module.exports = app;