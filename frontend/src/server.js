// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');

const { startScheduler } = require('./scheduler');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
// 数据存储目录
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

startScheduler({
    dataDir,
    intervalMs: 10 * 1000, // 每分钟扫一次
});


// 默认便签模板
function defaultNote(id) {
    return [
        {
            id: id,
            title: "示例便签",
            content: "<b>Hello World</b>",
            taskDesc: "Return Hello World in bold",
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
        const notes = defaultNote(uuidv4());
        fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));
        return notes;
    }
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.error(err);
        // 出现读取错误，也初始化默认
        const notes = defaultNote(uuidv4());
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
    const { username, title, taskDesc, intervalHours } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });
    if (!taskDesc) return res.status(400).json({ error: 'content is required' });

    const notes = loadNotes(username);

    const id = uuidv4();
    const note = {
        id,
        title: title || "无标题",
        taskDesc: taskDesc,
        content: "Not update yet",
        intervalHours: intervalHours || 1,
        createdAt: Date.now(),
        lastRunTime: null
    };

    notes.push(note);
    saveNotes(username, notes);

    res.json(note);
});

// app.post('/run-command', (req, res) => {
//     const cmd = req.body.cmd; // 从前端传来的命令，注意安全性！
//
//     exec(cmd, (error, stdout, stderr) => {
//         if (error) return res.status(500).send(error.message);
//         if (stderr) console.error(stderr);
//         res.json({ output: stdout.trim() });
//     });
// });
//
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
