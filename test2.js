const fs = require('fs');
fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ currentFrame: 'data:image/jpeg;base64,iVBORQ0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', description: 'Human' })
}).then(res => res.text()).then(t => fs.writeFileSync('out.txt', t)).catch(console.error);
