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

module.exports = {makeBookmarksArray};