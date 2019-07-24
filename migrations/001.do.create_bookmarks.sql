CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  title VARCHAR(30) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  rating SMALLINT NOT NULL,
  expand BOOLEAN DEFAULT FALSE
);