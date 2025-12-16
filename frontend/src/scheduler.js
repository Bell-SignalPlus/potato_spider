const fs = require('fs');
const path = require('path');
const {exec} = require("child_process");
const {json} = require("express/lib/response");

// ========================
// mock 命令执行（后续可替换）
// ========================
async function executeCommand(note) {
    return new Promise(async (resolve, reject) => {
        // 构造要执行的命令
        // 假设你想输出环境变量 MY_ENV
        // 在 Linux/macOS
        const cmd = `python3 /Users/zihao/PyCharmMiscProject/browser_use_test.py "${note.content}"`;
        // 在 Windows 可以用: const cmd = 'echo %MY_ENV%';
        // const response = await fetch('http://localhost:3000/run-command', {
        //     method: 'POST',
        //     headers: {'Content-Type': 'application/json'},
        //     body: JSON.stringify({cmd: cmd}) // Linux/macOS
        // });
        exec(cmd, (error, stdout, stderr) => {
            if (error) return reject("Exec error: " + error.message);
            if (stderr) return reject("Exec error: " + stderr);
            resolve(stdout.trim());
        });
    });
}

// <div>
//     <h3>${note.title}</h3>
//     <p>Command output: ${stdout.trim()}</p>
//     <p>Generated at ${new Date().toLocaleString()}</p>
// </div>

// ========================
// 是否需要执行
// ========================
function shouldRun(note) {
    if (!note.intervalHours) return false;

    if (!note.lastRunTime) return true;

    const now = Date.now();
    const intervalMs = note.intervalHours * 60 * 60 * 1000;
    return now - note.lastRunTime >= intervalMs;
}

// ========================
// 执行单个 note
// ========================
async function runNote(note) {
    const result = await executeCommand(note);
    console.log(`Note ${note.id} executed, result: ${result}`);
    note.content = result;
    note.lastRunTime = Date.now();
}

// ========================
// 处理单个用户文件
// ========================
async function processUserFile(filePath) {
    let notes;
    try {
        notes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.error(`Failed to read ${filePath}`, err);
        return;
    }

    let changed = false;

    for (const note of notes) {
        if (shouldRun(note)) {
            try {
                await runNote(note);
                changed = true;
            } catch (err) {
                console.error(`Run note failed: ${note.id}`, err);
            }
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));
    }
}

// ========================
// 扫描 data 目录
// ========================
async function scanAndRunNotes(dataDir) {
    const files = fs.readdirSync(dataDir)
        .filter(f => f.endsWith('.json'));

    for (const file of files) {
        await processUserFile(path.join(dataDir, file));
    }
}

// ========================
// 启动定时任务（对外暴露）
// ========================
let isRunning = false;
function startScheduler(options) {
    const {
        dataDir,
        intervalMs = 60 * 1000, // 默认 1 分钟
    } = options;

    if (!dataDir) {
        throw new Error('dataDir is required');
    }

    console.log(`Scheduler started, interval=${intervalMs}ms`);

    setInterval(() => {
        safeScanAndRun(dataDir)
            .catch(err => console.error('Scheduler error', err));
    }, intervalMs);
}

async function safeScanAndRun(dataDir) {
    if (isRunning) {
        console.log('Scheduler still running, skip this round');
        return;
    }

    isRunning = true;
    try {
        await scanAndRunNotes(dataDir);
    } catch (err) {
        console.error('Scheduler error', err);
    } finally {
        isRunning = false;
    }
}

// ========================
// 对外导出
// ========================
module.exports = {
    startScheduler,
    scanAndRunNotes, // 如果你想手动触发
};
