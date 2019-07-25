const { expect } = require('chai');
const knex = require('knex');

const app = require('../src/app');
const {makeBookmarksArray, makeMaliciousBookmark} = require('./bookmarks.fixtures');

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

  
  describe('GET /api/bookmarks', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
  
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
  
      it('Responds with 200 and all bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });
    });

    context('Given no bookmarks', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  describe('GET /api/bookmarks/:id', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it.skip('responds with 200 and the specified bookmark', () => {
        const testId = 1;
        const expectedBookmark = testBookmarks[testId - 1];

        return supertest(app)
          .get(`/api/bookmarks/${testId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });
    });

    context('Given no bookmarks in the database', () => {
      it('responds with 404', () => {
        const testId = 999999999;
        
        return supertest(app)
          .get(`/api/bookmarks/${testId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404);
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ]);
      });

      it.skip('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(expectedBookmark.description);
          });
      });
    });
  });
  
  describe('POST /api/bookmarks', () => {
    it.skip('creates a bookmark and responds with 201', () => {
      const newBookmark = {
        title: 'NatGeo',
        url: 'http://asdf.com',
        description: 'Our world is neat!',
        rating: 5
      };

      return supertest(app)
        .post('/api/bookmarks')
        .set('Authorization', 'bearer ' + process.env.API_TOKEN)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(postRes => 
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .set('Authorization', 'bearer ' + process.env.API_TOKEN)
            .expect(postRes.body)
        );
    });

    const requiredFields = ['title', 'url', 'rating'];
    requiredFields.forEach(field => {
      it(`responds with 400 "Field ${field} is required" if invalid data`, () => {
        const invalidData = makeBookmarksArray()[0];
        delete invalidData[field];

        return supertest(app)
          .post('/api/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .send(invalidData)
          .expect(400, { message: `Field "${field}" is required` });
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      it('removes XSS attack content', () => {
        return supertest(app)
          .post('/api/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .send(maliciousBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  describe('DELETE /api/bookmarks/:id', () => {
    context('Given the correct bookmark id', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      const idToRemove = 1;
      const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
      return supertest(app)
        .delete(`/api/bookmarks/${idToRemove}`)
        .set('Authorization', 'bearer ' + process.env.API_TOKEN)
        .expect(204)
        .then(() => {
          return supertest(app)
            .get('api/bookmarks')
            .expect(expectedBookmarks);
        });
    });

    context('Given no bookmarks', () => {
      it.skip('responds with 404', () => {
        const testId = 999999999;
        return supertest(app)
          .delete(`/api/bookmarks/${testId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404, { error: {message: 'Bookmark doesn\'t exist'}});
      });
    });
  });
});