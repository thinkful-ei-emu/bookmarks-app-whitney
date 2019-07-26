const express = require('express');
const xss = require('xss');
const path = require('path');

const logger = require('../logger');
const BookmarkService = require('../bookmarks/bookmarks-service');
const { getBookmarkValidationError } = require('./bookmark-validator');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serializeBookmarks = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});

bookmarkRouter
  .route('/')

  .get((req, res, next) => {
    const db = req.app.get('db');
    BookmarkService.getAllBookmarks(db)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmarks));
      })
      .catch(err => next(err));
  })

  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating} = req.body;
    const db = req.app.get('db');
    const newBookmark = {title, url, description, rating};

    const requiredFields = ['title', 'url', 'rating'];
    for (const field of requiredFields) {
      if (!newBookmark[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send({error: {message: `${field} is required`}});
      }
    }

    const error = getBookmarkValidationError(newBookmark);

    if (error) return res.status(400).send(error);

    BookmarkService.insertBookmark(db, newBookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${bookmark.id}`))
          .json(serializeBookmarks(bookmark));
      })
      .catch(err => next(err));
    
  });

bookmarkRouter
  .route('/:id')

  .all((req, res, next) => {
    const { id } = req.params;
    const db = req.app.get('db');

    BookmarkService.getBookmarkById(db, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).json({
            error: {message: 'Bookmark Not Found'}
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(err => next(err));
  })

  .get((req, res) => {
    res.status(200).json(serializeBookmarks(res.bookmark));
  })

  .delete((req, res, next) => {
    const { id } = req.params;
    const db = req.app.get('db');
    
    BookmarkService.deleteBookmark(db, id)
      .then(() => {
        logger.info(`Bookmark with id ${id} deleted.`);
        res.status(204).end();
      })
      .catch(err => next(err));
  })

  .patch(bodyParser, (req, res, next) => {
    const {title, url, description, rating } = req.body;
    const { id } = req.params;
    const bookmarkToUpdate = {title, url, description, rating};
    const db = req.app.get('db');

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;

    if (numberOfValues === 0) {
      logger.error('Invalid update without required fields');
      return res.status(400).json({
        error: {
          message: 'Request body must contain either title, url, description or rating'
        }
      });
    }

    const error = getBookmarkValidationError(bookmarkToUpdate);

    if (error) return res.status(400).send(error);

    BookmarkService.updateBookmark(db, id, bookmarkToUpdate)
      .then(() => {
        res.status(204).end();
      })
      .catch(err => next(err));
  });

module.exports = bookmarkRouter;