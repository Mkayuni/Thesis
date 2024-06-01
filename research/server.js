const http = require('http-server');

const server = http.createServer({
  root: './',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
