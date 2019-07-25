function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Bobs Burgers Twitter',
      url: 'http://asdf.com',
      description: 'Best puns and buns',
      rating: 5,
      expand: false,
    }, {
      id: 2,
      title: 'AnalogSea',
      url: 'http://asdf.com',
      description: 'Practice makes perfect',
      rating: 3,
      expand: false,
    }, {
      id: 3,
      title: 'Reading Rainbow',
      url: 'http://readingrainbow.com',
      description: 'If it is in a book...',
      rating: 4,
      expand: false,
    }
    
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 6,
    title: 'Can\'t catch me <script>alert("xss");</script>',
    url: 'http://hackerman.com',
    description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    rating: 1,
    expand: false,
  };

  const expectedBookmark = {
    ...maliciousBookmark,
    title:'Can\'t catch me &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    content: 'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.'
  }

  return {
    maliciousBookmark,
    expectedBookmark,
  }
}

module.exports = {makeBookmarksArray, makeMaliciousBookmark};