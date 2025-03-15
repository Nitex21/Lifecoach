const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // 添加静态文件服务配置

require('dotenv').config();
const API_KEY = process.env.API_KEY;
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-250120',
        messages: req.body.messages,
        temperature: 0.6,
        stream: true
      }),
      timeout: 60000
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { Transform } = require('stream');
    const sseTransform = new Transform({
      transform(chunk, encoding, callback) {
        try {
          const jsonStr = chunk.toString().trim();
          const data = jsonStr.startsWith('data: ') ? jsonStr : `data: ${jsonStr}`;
          this.push(`${data}\n\n`);
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });

    response.body
      .pipe(sseTransform)
      .pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});