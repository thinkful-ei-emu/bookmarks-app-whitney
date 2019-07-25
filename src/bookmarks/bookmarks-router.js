const express = require('express');
const xss = require('xss');

const bookmarks = require('../store');
const logger = require('../logger');
const BookmarkService = require('../bookmarks-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serializeBookmarks = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: bookmark.rating,
  expand: bookmark.expand
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
      if (!req.body[field]) {
        return res.status(400).json({ message: `Field "${field}" is required`});
      }
    }

    BookmarkService.insertBookmark(db, newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(`/api/bookmarks/${bookmark.id}`)
          .json(serializeBookmarks(bookmark));
      })
      .catch(err => next(err));
    
  });

bookmarkRouter
  .route('/:id')
  .get((req, res, next) => {
    const { id } = req.params;
    const db = req.app.get('db');

    BookmarkService.getBookmarkById(db, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res
            .status(404)
            .json({ error: { message: 'Bookmark not found'} });
        }
        return res
          .status(200)
          .json(serializeBookmarks(res.bookmark));
      })
      .catch(err => next(err));
  })

  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id === id);
    
    if (bookmarkIndex === -1) {
      logger.error(`List with id ${id} not found`);
      return res
        .status(404)
        .send('Not found');
    }
    
    bookmarks.splice(bookmarkIndex, 1);
  
    logger.info(`List with id ${id} deleted.`);
  
    res
      .status(204)
      .end();
  });

// .patch(bodyParser, (req, res) => {
//   const { title, url, description, rating } = req.body;
//   const {id} = req.params;
  
//   const bookmark = bookmarks.find(bookmark => bookmark.id === id);
  
//   if(title) {
//     bookmark.title = title;
//   } else
//   if(url) {
//     bookmark.url = url;
//   } else
//   if (description) {
//     bookmark.description = description;
//   } else
//   if (rating) {
//     bookmark.rating = rating;
//   }
  
//   logger.info(`Bookmark with id ${id} was updated`);
  
//   res
//     .status(200)
//     .location(`http://localhost8000/bookmark/${id}`)
//     .json(bookmark);
  
// })

module.exports = bookmarkRouter;