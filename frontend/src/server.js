// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Mock 数据
let notes = [
    {
        id: 1,
        title: "示例便签",
        content: "<b>Hello World</b>",
        intervalHours: 1,
        createdAt: Date.now(),
        lastRunTime: null
    }
];

// 获取便签列表
app.get('/api/notes', (req, res) => {
    res.json(notes);
});

// 新建便签
app.post('/api/notes', (req, res) => {
    const { title, content, intervalHours } = req.body;

    if (!content) {
        return res.status(400).json({ error: "content is required" });
    }

    const id = notes.length ? notes[notes.length - 1].id + 1 : 1;

    const note = {
        id,
        title: title || "无标题",
        content,
        intervalHours: intervalHours || 1,
        createdAt: Date.now(),
        lastRunTime: null
    };

    notes.push(note);

    // 这里将来可添加写入文件或数据库，现在先 mock
    res.json(note);
});

app.listen(port, () => {
    console.log(`Mock server running at http://localhost:${port}`);
});

import fs from "fs";

function save(data) {
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

function load() {
    if (!fs.existsSync("data.json")) return [];
    return JSON.parse(fs.readFileSync("data.json", "utf8"));
}
