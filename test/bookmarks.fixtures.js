/*eslint no-useless-escape: 0*/
function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Bobs Burgers Twitter',
      url: 'http://asdf.com',
      description: 'Best puns and buns',
      rating: 5,
    }, {
      id: 2,
      title: 'AnalogSea',
      url: 'http://asdf.com',
      description: 'Practice makes perfect',
      rating: 3,
    }, {
      id: 3,
      title: 'Reading Rainbow',
      url: 'http://readingrainbow.com',
      description: 'If it is in a book...',
      rating: 4,
    }
    
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 6,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'http://hackerman.com',
    description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    rating: 1,
  };

  const expectedBookmark = {
    id: 6,
    title:'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    url: 'htt[://hackerman.com',
    description: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.',
    rating: 1,
  };

  return {
    maliciousBookmark,
    expectedBookmark,
  };
}

module.exports = {makeBookmarksArray, makeMaliciousBookmark};