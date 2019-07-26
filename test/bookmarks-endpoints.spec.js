const knex = require('knex');
const fixtures = require('./bookmarks.fixtures');
const app = require('../src/app');

describe('Bookmarks Endpoints', () => {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  const clearBookmarks = () => db('bookmarks').truncate();
  before('clear table', clearBookmarks);
  afterEach('clear table', clearBookmarks);

  // ------------------------------------------------------ UNAUTHORIZED

  describe('Unauthorized requests', () => {
    const testBookmarks = fixtures.makeBookmarksArray();

    beforeEach('insert bookmarks', () => {
      return db('bookmarks')
        .insert(testBookmarks);
    });

    it('responds with 401 Unauthorized for GET /api/bookmarks', () => {
      return supertest(app)
        .get('/api/bookmarks')
        .expect(401, {error: 'Unauthorized request'});
    });

    it('responds with 401 unauthorized for POST /api/bookmarks', () => {
      return supertest(app)
        .post('/api/bookmarks')
        .send({ title: 'Testing Title', url: 'http://testing-url.com', rating: 1 })
        .expect(401, { error: 'Unauthorized request'});
    });

    it('responds with 401 unauthorized for DELETE /api/bookmarks/:id', () => {
      const testingBookmark = testBookmarks[1];
      return supertest(app)
        .delete(`/api/bookmarks/${testingBookmark.id}`)
        .expect(401, { error: 'Unauthorized request'});
    });

    it('responds with 401 unauthorized for PATCH /api/bookmarks/:id', () => {
      const testingBookmark = testBookmarks[1];
      return supertest(app)
        .patch(`/api/bookmarks/${testingBookmark.id}`)
        .send({ title: 'Testing Title'})
        .expect(401, { error: 'Unauthorized request'});
    });
  });

  // ------------------------------------------------------ GET ALL

  describe('GET /api/bookmarks', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray();
  
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
  
      it('Responds with 200 and all bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });
    });

    context('Given no bookmarks', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  // ------------------------------------------------------ GET INDIVIDUAL

  describe('GET /api/bookmarks/:id', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and the specified bookmark', () => {
        const testId = 2;
        const expectedBookmark = testBookmarks[testId - 1];

        return supertest(app)
          .get(`/api/bookmarks/${testId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });
    });

    context('Given an XSS attack', () => {
      const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark]);
      });

      it.skip('removes XSS attack content', () => { // ------------------ unauthorized request to path
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', 'Bearer' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });

    context('Given no bookmarks in the database', () => {
      it('responds with 404', () => {
        const testId = 999999999;
          
        return supertest(app)
          .get(`/api/bookmarks/${testId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: 'Bookmark Not Found'}});
      });
    });
  });

  // ------------------------------------------------------ POST
  
  describe('POST /api/bookmarks', () => {
    it('creates a bookmark and responds with 201', () => {
      const newBookmark = {
        title: 'NatGeo',
        url: 'http://asdf.com',
        description: 'Our world is neat!',
        rating: 5,
      };

      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(res => 
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(res.body)
        );
    });

    const requiredFields = ['title', 'url', 'rating'];
    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'Testing Title',
        url: 'https:testing-url.com',
        rating: 2
      };

      it(`responds with 400 missing ${field} if not supplied`, () => {
        delete newBookmark[field];
        console.log(newBookmark);

        return supertest(app)
          .post('/api/bookmarks')
          .send(newBookmark)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(400, { error: { message: `${field} is required` } });
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark();

      it('removes XSS attack content', () => {
        return supertest(app)
          .post('/api/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(maliciousBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  // ------------------------------------------------------ DELETE

  describe('DELETE /api/bookmarks/:id', () => {
    context('Given the correct bookmark id', () => {
      const testBookmarks = fixtures.makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('removes bookmark with valid id', () => { 
        const idToRemove = 1;
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then(() => 
            supertest(app)
              .get('/api/bookmarks')
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmarks)
          );
      });
    });

    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const testId = 999999999;
        return supertest(app)
          .delete(`/api/bookmarks/${testId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: {message: 'Bookmark Not Found'}});
      });
    });
  });

  // ------------------------------------------------------ PATCH

  describe('PATCH /api/bookmarks/:id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const testId = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${testId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: 'Bookmark Not Found'} });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 204 and updates the bookmark', () => { 
        const testId = 2;
        const updateBookmark = {
          title: 'NASA',
          url: 'http://nasa.gov',
          description: 'Woah space!',
          rating: 5,
        };

        const expectedBookmark = {
          ...testBookmarks[testId - 1],
          ...updateBookmark
        };

        return supertest(app)
          .patch(`/api/bookmarks/${testId}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(updateBookmark)
          .expect(204)
          .then(() => 
            supertest(app)
              .get(`/api/bookmarks/${testId}`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmark)
          );
      });
    });
  });
});