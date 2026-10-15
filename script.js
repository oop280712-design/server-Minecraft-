// --- ตัวแปรหลักของระบบ ---
let serverConfig = {
    edition: 'Java Edition',
    loader: 'Forge',
    version: '1.20.1',
    ram: 4096,
    name: 'My-Server'
};

let currentStep = 1;
let metricsInterval = null;
let bannedPlayers = []; // เก็บรายชื่อผู้เล่นที่ถูกแบน

// ฐานข้อมูลเวอร์ชันแยกตามประเภทซอฟต์แวร์
const softwareVersions = {
    Vanilla: ['1.21.4', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5'],
    Forge: ['1.20.1', '1.19.2', '1.18.2', '1.16.5', '1.12.2'],
    NeoForge: ['1.21.4', '1.20.4', '1.20.2'],
    Fabric: ['1.21.4', '1.20.4', '1.20.1', '1.19.4'],
    Paper: ['1.21.4', '1.20.4', '1.20.1', '1.19.4'],
    Crossplay: ['1.20.x - 1.21.x (GeyserMC Support)']
};


// --- 1. ระบบเข้าสู่ระบบ / สมัครสมาชิก (Auth) ---
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const btns = document.querySelectorAll('.tab-btn');
    
    btns.forEach(b => b.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        btns[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        btns[1].classList.add('active');
    }
}

function handleAuth(type) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('wizard-screen').style.display = 'block';
}


// --- 2. ระบบสร้างเซิร์ฟเวอร์ (Wizard) ---
function selectEdition(editionName, element) {
    serverConfig.edition = editionName;
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
}

function nextStep() {
    if (currentStep === 2) {
        serverConfig.loader = document.getElementById('loader-select').value;
    } else if (currentStep === 3) {
        serverConfig.ram = parseInt(document.getElementById('wizard-ram').value);
    } else if (currentStep === 4) {
        let nameInput = document.getElementById('server-name-input').value.trim();
        let termsCheck = document.getElementById('terms-check').checked;
        
        if (nameInput === "") { alert("กรุณาตั้งชื่อเซิร์ฟเวอร์ก่อนครับ"); return; }
        if (!termsCheck) { alert("กรุณากดยอมรับเงื่อนไขการให้บริการ"); return; }
        
        serverConfig.name = nameInput;
        finishWizard();
        return;
    }
    
    if (currentStep < 4) {
        currentStep++;
        updateWizardView();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateWizardView();
    }
}

function updateWizardView() {
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.style.display = parseInt(step.dataset.step) === currentStep ? 'block' : 'none';
    });
    document.getElementById('step-indicator').textContent = `ขั้นตอนที่ ${currentStep} / 4`;
    document.getElementById('prev-btn').style.display = currentStep === 1 ? 'none' : 'block';
    document.getElementById('next-btn').textContent = currentStep === 4 ? 'ยอมรับและสร้าง' : 'ถัดไป';
}

function finishWizard() {
    document.getElementById('wizard-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
    updateDashboardHeader();
    initSoftwareOptions();
}

function updateDashboardHeader() {
    document.getElementById('panel-server-name').textContent = serverConfig.name;
    document.getElementById('panel-server-info').textContent = `${serverConfig.edition} | ${serverConfig.loader} (${serverConfig.version || '1.20.1'}) | ${serverConfig.ram / 1024} GB RAM`;
    document.getElementById('display-max-ram').textContent = `${serverConfig.ram} MB`;
    document.getElementById('ram-text').textContent = `0 MB / ${serverConfig.ram} MB`;
}


// --- 3. ระบบสลับแท็บเมนูดดานบน (Navigation Tabs) ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.currentTarget.classList.add('active');
}


// --- 4. ระบบจัดการซอฟต์แวร์ (Software Tab) ---
function initSoftwareOptions() {
    updateVersionOptions();
}

function updateVersionOptions() {
    const typeSelect = document.getElementById('sw-type').value;
    const versionSelect = document.getElementById('sw-version');
    versionSelect.innerHTML = '';
    
    let versions = softwareVersions[typeSelect] || [];
    versions.forEach(ver => {
        let opt = document.createElement('option');
        opt.value = ver;
        opt.textContent = ver;
        versionSelect.appendChild(opt);
    });
}

function changeSoftwareVersion() {
    let statusBadge = document.getElementById('status-badge');
    if (statusBadge.classList.contains('online')) {
        alert("กรุณาปิดเซิร์ฟเวอร์ก่อนเปลี่ยนซอฟต์แวร์หรือเวอร์ชัน!");
        return;
    }
    serverConfig.loader = document.getElementById('sw-type').value;
    serverConfig.version = document.getElementById('sw-version').value;
    updateDashboardHeader();
    log(`เปลี่ยนซอฟต์แวร์สำเร็จเป็น: ${serverConfig.loader} (${serverConfig.version})`);
    alert("เปลี่ยนซอฟต์แวร์และเวอร์ชันเรียบร้อยแล้ว!");
    switchTab('server');
}


// --- 5. ระบบจัดการผู้เล่น (Players Tab: OP, Ban, Unban) ---
function managePlayer(action) {
    let username = document.getElementById('target-player').value.trim();
    if (username === "") { alert("กรุณากรอกชื่อผู้เล่นก่อนครับ"); return; }

    if (action === 'op') {
        log(`Made ${username} a server operator`);
        alert(`ให้สิทธิ์ OP แก่ผู้เล่น ${username} เรียบร้อยแล้ว`);
    } else if (action === 'ban') {
        if (!bannedPlayers.includes(username)) {
            bannedPlayers.push(username);
            log(`Banned player ${username} from the server`);
            updateBannedList();
            alert(`แบนผู้เล่น ${username} เรียบร้อยแล้ว`);
        } else {
            alert("ผู้เล่นคนนี้ถูกแบนอยู่แล้ว");
        }
    }
    document.getElementById('target-player').value = '';
}

function unbanPlayer(username) {
    bannedPlayers = bannedPlayers.filter(p => p !== username);
    log(`Unbanned player ${username}`);
    updateBannedList();
    alert(`ยกเลิกการแบนผู้เล่น ${username} แล้ว`);
}

function updateBannedList() {
    let listEl = document.getElementById('banned-list');
    listEl.innerHTML = '';
    if (bannedPlayers.length === 0) {
        listEl.innerHTML = '<li>ไม่มีผู้เล่นที่ถูกแบน</li>';
        return;
    }
    bannedPlayers.forEach(player => {
        let li = document.createElement('li');
        li.innerHTML = `${player} <button class="unban-btn" onclick="unbanPlayer('${player}')">ปลดแบน</button>`;
        listEl.appendChild(li);
    });
}


// --- 6. ระบบควบคุมเซิร์ฟเวอร์, คอนโซล และทรัพยากร (Server & Console) ---
const statusBadge = document.getElementById('status-badge');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const consoleOutput = document.getElementById('console-output');
const commandInput = document.getElementById('command-input');
const sendBtn = document.getElementById('send-btn');
const cpuText = document.getElementById('cpu-text');
const cpuFill = document.getElementById('cpu-fill');
const ramText = document.getElementById('ram-text');
const ramFill = document.getElementById('ram-fill');

function log(message) {
    consoleOutput.innerHTML += `<br>[${new Date().toLocaleTimeString()}] ${message}`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function startMetricsSimulation() {
    metricsInterval = setInterval(() => {
        let randomCpu = Math.floor(Math.random() * 40) + 20;
        let randomRam = Math.floor(Math.random() * (serverConfig.ram * 0.35)) + Math.floor(serverConfig.ram * 0.5);
        let ramPercent = (randomRam / serverConfig.ram) * 100;
        
        cpuText.textContent = randomCpu + "%";
        cpuFill.style.width = randomCpu + "%";
        ramText.textContent = `${randomRam} MB / ${serverConfig.ram} MB`;
        ramFill.style.width = ramPercent + "%";
    }, 2000);
}

function stopMetricsSimulation() {
    clearInterval(metricsInterval);
    cpuText.textContent = "0%";
    cpuFill.style.width = "0%";
    ramText.textContent = `0 MB / ${serverConfig.ram} MB`;
    ramFill.style.width = "0%";
}

function startServer() {
    startBtn.disabled = true;
    statusBadge.textContent = "Starting...";
    statusBadge.className = "offline";
    log(`กำลังเปิดเซิร์ฟเวอร์ [${serverConfig.name}] (${serverConfig.loader} - ${serverConfig.version || '1.20.1'})...`);

    setTimeout(() => {
        log(`Loading libraries & environment on 5 vCPU / ${serverConfig.ram} MB RAM...`);
    }, 1500);

    setTimeout(() => {
        statusBadge.textContent = "Online";
        statusBadge.className = "online";
        stopBtn.disabled = false;
        commandInput.disabled = false;
        sendBtn.disabled = false;
        log(`Server started successfully on port 25565!`);
        startMetricsSimulation();
    }, 3500);
}

function stopServer() {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    commandInput.disabled = true;
    sendBtn.disabled = true;
    statusBadge.textContent = "Stopping...";
    log("กำลังบันทึกข้อมูลโลกและปิดเซิร์ฟเวอร์อย่างปลอดภัย...");
    stopMetricsSimulation();

    setTimeout(() => {
        statusBadge.textContent = "Offline";
        statusBadge.className = "offline";
        startBtn.disabled = false;
        log("Server closed safely.");
    }, 2000);
}

function resetServer() {
    if (confirm("คุณแน่ใจหรือไม่ที่จะรีเซ็ตเซิร์ฟเวอร์? ข้อมูลและการตั้งค่าทั้งหมดจะถูกล้างใหม่!")) {
        stopMetricsSimulation();
        statusBadge.textContent = "Offline";
        statusBadge.className = "offline";
        startBtn.disabled = false;
        stopBtn.disabled = true;
        commandInput.disabled = true;
        sendBtn.disabled = true;
        consoleOutput.innerHTML = "Server has been reset to factory defaults.";
        alert("รีเซ็ตเซิร์ฟเวอร์เรียบร้อยแล้ว");
    }
}

function sendCommand() {
    let cmd = commandInput.value.trim();
    if (cmd === "") return;
    log(`> ${cmd}`);

    if (cmd === "/help") {
        log("Available commands: /help, /save-all, /time set day, /op [player]");
    } else if (cmd === "/save-all") {
        log("Saved the game successfully.");
    } else if (cmd.startsWith("/op ")) {
        let playerName = cmd.split(" ")[1];
        log(`Made ${playerName} a server operator`);
    } else {
        log(`Executed command: ${cmd}`);
    }
    commandInput.value = "";
}

function checkEnter(event) {
    if (event.key === "Enter") {
        sendCommand();
    }
}
