const express = require('express');
const app = express();
app.use(express.json({ limit: '100kb' }));
app.post('/api/list', (req, res) => res.json({ ok: true }));
app.listen(3002, () => console.log('started'));
