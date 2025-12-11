// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// 数据存储目录
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// 默认便签模板
function defaultNote() {
    return [
        {
            id: 1,
            title: "示例便签",
            content: "<b>Hello World</b>",
            intervalHours: 1,
            createdAt: Date.now(),
            lastRunTime: null
        }
    ];
}

// 读取某个用户的便签，如果文件不存在则创建默认
function loadNotes(username) {
    const filePath = path.join(dataDir, `${username}.json`);
    if (!fs.existsSync(filePath)) {
        const notes = defaultNote();
        fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));
        return notes;
    }
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.error(err);
        // 出现读取错误，也初始化默认
        const notes = defaultNote();
        fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));
        return notes;
    }
}

// 保存某个用户的便签
function saveNotes(username, notes) {
    const filePath = path.join(dataDir, `${username}.json`);
    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));
}

// 获取便签列表
app.get('/api/notes', (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'username is required' });

    const notes = loadNotes(username);
    res.json(notes);
});

// 新建便签
app.post('/api/notes', (req, res) => {
    const { username, title, content, intervalHours } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    if (!content) return res.status(400).json({ error: 'content is required' });

    const notes = loadNotes(username);

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
    saveNotes(username, notes);

    res.json(note);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
