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



const port = process.env.PORT || 5000;
// const host = process.env.HOST || '127.0.0.1';
const host = '100.103.163.38'

app.listen(port, host, () => {
    console.log(`Server running at https://${host}:${port}`);
});

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
            updatedAt: Date.now(),
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
    if (notes.length >= 10) {
        return res.status(400).json({ error: '最多只能创建10个便签' });
    }

    const id = uuidv4();
    const note = {
        id,
        title: title || "无标题",
        taskDesc: taskDesc,
        content: "Not update yet",
        intervalHours: intervalHours || 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastRunTime: null
    };

    notes.push(note);
    saveNotes(username, notes);

    res.json(note);
});

// 编辑便签
app.put('/api/notes/:id', (req, res) => {
    const username = req.query.username;
    const noteId = req.params.id;
    const { title, taskDesc, content, intervalHours } = req.body;

    if (!username) return res.status(400).json({ error: 'username is required' });

    const notes = loadNotes(username);
    const noteIndex = notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return res.status(404).json({ error: 'note not found' });

    // 更新字段
    if (title !== undefined) notes[noteIndex].title = title;
    if (taskDesc !== undefined) notes[noteIndex].taskDesc = taskDesc;
    if (content !== undefined) notes[noteIndex].content = content;
    if (intervalHours !== undefined) notes[noteIndex].intervalHours = intervalHours;
    notes[noteIndex].updatedAt = Date.now();
    notes[noteIndex].lastRunTime = 0; // 重置上次执行时间，确保下次调度时会执行

    saveNotes(username, notes);
    res.json(notes[noteIndex]);
});

// 删除便签
app.delete('/api/notes/:id', (req, res) => {
    const username = req.query.username;
    const noteId = req.params.id;

    if (!username) return res.status(400).json({ error: 'username is required' });

    const notes = loadNotes(username);
    const newNotes = notes.filter(n => n.id !== noteId);

    if (newNotes.length === notes.length) {
        return res.status(404).json({ error: 'note not found' });
    }

    saveNotes(username, newNotes);
    res.json({ success: true });
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


