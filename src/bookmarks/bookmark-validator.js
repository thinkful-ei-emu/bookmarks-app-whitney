const { isWebUri } = require('valid-url');
const logger = require('../logger');

const NO_ERRORS = null;

function getBookmarkValidationError({url, rating}) {
  if(rating && 
  (!Number.isInteger(rating) || rating <1 || rating > 5)) {
    logger.error('Invalid rating');
    return { error: {message: 'Rating must be between 1 and 5'}};
  }

  if (url && !isWebUri(url)) {
    logger.error('Invalid url');
    return {error: {message: 'Not a valid url'}};
  }

  return NO_ERRORS;
}

module.exports = {
  getBookmarkValidationError,
};