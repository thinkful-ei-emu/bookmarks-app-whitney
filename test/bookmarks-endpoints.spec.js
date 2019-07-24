const { expect } = require('chai');
const knex = require('knex');

const app = require('../src/app');
const {makeBookmarksArray} = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', () => {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  const clearBookmarks = () => db('bookmarks').truncate();
  before('clear table', clearBookmarks);
  afterEach('clear table', clearBookmarks);

  after('disconnect from db', () => db.destroy());

  
  describe('GET /bookmarks', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
  
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
  
      it('Responds with 200 and all bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });
    });

    context('Given no bookmarks', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });
    });
  });

  describe('GET /bookmarks/:id', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and the specified bookmark', () => {
        const testId = 1;
        const expectedBookmark = testBookmarks[testId - 1];

        return supertest(app)
          .get(`/bookmarks/${testId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });
    });

    context('Given no bookmarks in the database', () => {
      it('responds with 404', () => {
        const testId = 999999999;
        
        return supertest(app)
          .get(`/bookmarks/${testId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404);
      });
    });
  });
  

});