// Should contain methods for CRUD

const BookmarkService = {
  // ========== READ ==========

  // Returns all bookmarks
  getAllBookmarks(db) {
    return db('bookmarks')
      .select('*');
  },

  // Returns specific bookmark by ID
  getBookmarkById(db, id) {
    return db('bookmarks')
      .select('*')
      .where('id', id)
      .first();
  },

  // ========== CREATE ==========
  insertBookmark(db, newBookmark) {
    return db('bookmarks')
      .insert(newBookmark)
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  // ========== UPDATE ==========
  updateBookmark(db, id, newData) {
    return db('bookmarks')
      .where('id', id)
      .update(newData);
  },

  // ========== DELETE ==========
  deleteBookmark(db, id) {
    return db('bookmarks')
      .where('id', id)
      .delete();
  }
};

module.exports = BookmarkService;