const app = require('../src/app');
// expect and supertest available globally -- see test/setup.js

describe.skip('GET /', () => {
  it.skip('GET / responds with 200 containing "Hello, world!"', () => {
    return supertest(app)
      .get('/')
      .expect(200, 'Hello, world!');
  });
});