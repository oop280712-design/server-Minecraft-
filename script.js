const statusBadge = document.getElementById('status-badge');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const consoleOutput = document.getElementById('console-output');
const commandInput = document.getElementById('command-input');
const sendBtn = document.getElementById('send-btn');
const ramSelect = document.getElementById('ram-select');

const cpuText = document.getElementById('cpu-text');
const cpuFill = document.getElementById('cpu-fill');
const ramText = document.getElementById('ram-text');
const ramFill = document.getElementById('ram-fill');

let metricsInterval = null;
let maxRam = 4096; // ค่าเริ่มต้น

function log(message) {
    consoleOutput.innerHTML += `<br>[${new Date().toLocaleTimeString()}] ${message}`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// จำลองการขยับของทรัพยากรบน 5 vCPU และ RAM สูงสุด 10GB
function startMetricsSimulation() {
    metricsInterval = setInterval(() => {
        // สุ่ม CPU ระหว่าง 20% - 60% บนพลัง 5 vCPU
        let randomCpu = Math.floor(Math.random() * 40) + 20;
        
        // สุ่มการใช้แรมให้อยู่ในช่วง 50% - 85% ของแรมที่เลือก
        let randomRam = Math.floor(Math.random() * (maxRam * 0.35)) + Math.floor(maxRam * 0.5);
        let ramPercent = (randomRam / maxRam) * 100;

        cpuText.textContent = randomCpu + "%";
        cpuFill.style.width = randomCpu + "%";

        ramText.textContent = `${randomRam} MB / ${maxRam} MB`;
        ramFill.style.width = ramPercent + "%";
    }, 2000);
}

function stopMetricsSimulation() {
    clearInterval(metricsInterval);
    cpuText.textContent = "0%";
    cpuFill.style.width = "0%";
    ramText.textContent = `0 MB / ${maxRam} MB`;
    ramFill.style.width = "0%";
}

function startServer() {
    maxRam = parseInt(ramSelect.value);
    ramSelect.disabled = true; // ล็อคไม่ให้เปลี่ยนค่าขณะเซิร์ฟเวอร์เปิดอยู่

    startBtn.disabled = true;
    statusBadge.textContent = "Starting...";
    statusBadge.className = "offline";
    log(`กำลังเปิดเซิร์ฟเวอร์ด้วยขีดความสามารถ 5 vCPU และแรม ${maxRam} MB...`);

    setTimeout(() => {
        log("Loading Java Virtual Machine & Forge libraries...");
    }, 1500);

    setTimeout(() => {
        statusBadge.textContent = "Online";
        statusBadge.className = "online";
        stopBtn.disabled = false;
        
        commandInput.disabled = false;
        sendBtn.disabled = false;

        log(`Server started successfully with 5 vCPU and ${maxRam} MB RAM allocated!`);
        startMetricsSimulation();
    }, 3500);
}

function stopServer() {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    commandInput.disabled = true;
    sendBtn.disabled = true;
    statusBadge.textContent = "Stopping...";
    log("กำลังบันทึกข้อมูลโลกและปิดเซิร์ฟเวอร์...");

    stopMetricsSimulation();

    setTimeout(() => {
        statusBadge.textContent = "Offline";
        statusBadge.className = "offline";
        startBtn.disabled = false;
        ramSelect.disabled = false; // ปลดล็อกให้เลือกแรมใหม่ได้
        log("Server closed safely.");
    }, 2000);
}

function sendCommand() {
    let cmd = commandInput.value.trim();
    if (cmd === "") return;

    log(`> ${cmd}`);

    if (cmd === "/help") {
        log("Available commands: /help, /save-all, /time set day, /op [player]");
    } else if (cmd === "/save-all") {
        log("Saved the game. Associated files written to disk.");
    } else if (cmd.startsWith("/op ")) {
        let playerName = cmd.split(" ")[1];
        log(`Made ${playerName} a server operator`);
    } else if (cmd === "/time set day") {
        log("Set time to 0");
    } else {
        log(`Unknown command. Type "/help" for help.`);
    }

    commandInput.value = "";
}

function checkEnter(event) {
    if (event.key === "Enter") {
        sendCommand();
    }
}
