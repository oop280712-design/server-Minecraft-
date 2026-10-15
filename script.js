// --- ระบบจัดเก็บเซิร์ฟเวอร์ทั้งหมด ---
let serversList = [
    { id: 1, name: 'My-First-Server', edition: 'Java Edition', loader: 'Forge', version: '26.3 (Latest)', ram: 4096 }
];

let activeServerId = 1;
let currentStep = 1;
let metricsInterval = null;
let bannedPlayers = [];

// ฐานข้อมูลไฟล์จำลอง (File Manager) ของแต่ละเซิร์ฟเวอร์
let serverFiles = {
    'server.properties': "enable-query=false\nminecraft-version=26.3\ndifficulty=easy\npvp=true\nmax-players=20\nonline-mode=true",
    'eula.txt': "#By changing the setting below to TRUE you are indicating your agreement to our EULA\neula=true",
    'ops.json': "[\n  {\n    \"uuid\": \"12345-abcde\",\n    \"name\": \"PlayerName\",\n    \"level\": 4\n  }\n]"
};

let currentEditingFile = '';

const softwareVersions = {
    Vanilla: ['26.3', '26.2', '26.1.2', '1.21.5', '1.21.4', '1.20.1', '1.16.5', '1.12.2'],
    Forge: ['26.3 (Latest)', '26.2', '1.21.4', '1.20.1', '1.16.5', '1.12.2'],
    NeoForge: ['26.3', '26.2', '1.21.4', '1.20.6'],
    Fabric: ['26.3', '1.21.4', '1.20.1', '1.19.4'],
    Paper: ['26.3', '1.21.4', '1.20.1', '1.12.2'],
    Crossplay: ['26.x - GeyserMC Support (Latest)', '1.21.x - GeyserMC Support']
};

// --- 1. Auth ---
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

function handleAuth() {
    document.getElementById('auth-screen').style.display = 'none';
    renderServerList();
    document.getElementById('server-list-screen').style.display = 'block';
}

// --- 2. Server List ---
function renderServerList() {
    const grid = document.getElementById('server-grid');
    grid.innerHTML = '';
    document.getElementById('server-count-badge').textContent = `คุณมีทั้งหมด ${serversList.length} เซิร์ฟเวอร์`;

    if (serversList.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #94a3b8;">ยังไม่มีเซิร์ฟเวอร์</p>';
        return;
    }

    serversList.forEach(srv => {
        let card = document.createElement('div');
        card.className = 'server-card-item';
        card.innerHTML = `
            <div class="server-card-info">
                <h3>${srv.name}</h3>
                <p>${srv.edition} | ${srv.loader} (${srv.version}) | ${srv.ram / 1024} GB RAM</p>
            </div>
            <button class="manage-server-btn" onclick="openServerDashboard(${srv.id})">จัดการ</button>
        `;
        grid.appendChild(card);
    });
}

function goToWizard() {
    document.getElementById('server-list-screen').style.display = 'none';
    currentStep = 1;
    updateWizardView();
    document.getElementById('wizard-screen').style.display = 'block';
}

function backToServerList() {
    stopMetricsSimulation();
    document.getElementById('dashboard-screen').style.display = 'none';
    renderServerList();
    document.getElementById('server-list-screen').style.display = 'block';
}

// --- 3. Wizard ---
let newServerDraft = { edition: 'Java Edition', loader: 'Forge', ram: 4096, name: '' };

function selectEdition(editionName, element) {
    newServerDraft.edition = editionName;
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
}

function nextStep() {
    if (currentStep === 2) {
        newServerDraft.loader = document.getElementById('loader-select').value;
    } else if (currentStep === 3) {
        newServerDraft.ram = parseInt(document.getElementById('wizard-ram').value);
    } else if (currentStep === 4) {
        let nameInput = document.getElementById('server-name-input').value.trim();
        if (nameInput === "") { alert("กรุณาตั้งชื่อเซิร์ฟเวอร์"); return; }
        newServerDraft.name = nameInput;
        startInstallationProcess();
        return;
    }
    if (currentStep < 4) { currentStep++; updateWizardView(); }
}

function prevStep() {
    if (currentStep > 1) { currentStep--; updateWizardView(); }
}

function updateWizardView() {
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.style.display = parseInt(step.dataset.step) === currentStep ? 'block' : 'none';
    });
    document.getElementById('step-indicator').textContent = `ขั้นตอนที่ ${currentStep} / 4`;
    document.getElementById('prev-btn').style.display = currentStep === 1 ? 'none' : 'block';
    document.getElementById('next-btn').textContent = currentStep === 4 ? 'ยอมรับและติดตั้ง' : 'ถัดไป';
}

// --- 4. Installing Screen ---
function startInstallationProcess() {
    document.getElementById('wizard-screen').style.display = 'none';
    document.getElementById('installing-screen').style.display = 'block';

    let percent = 0;
    let fill = document.getElementById('install-fill');
    let percentText = document.getElementById('install-percent');
    let statusText = document.getElementById('install-status-text');

    let timer = setInterval(() => {
        percent += Math.floor(Math.random() * 20) + 10;
        if (percent >= 100) {
            percent = 100;
            clearInterval(timer);
            
            let newSrv = {
                id: serversList.length + 1,
                name: newServerDraft.name,
                edition: newServerDraft.edition,
                loader: newServerDraft.loader,
                version: '26.3 (Latest)',
                ram: newServerDraft.ram
            };
            serversList.push(newSrv);

            setTimeout(() => {
                document.getElementById('installing-screen').style.display = 'none';
                openServerDashboard(newSrv.id);
            }, 600);
        }
        fill.style.width = percent + '%';
        percentText.textContent = percent + '%';
        if (percent < 40) statusText.textContent = "กำลังสร้างไฟล์ server.properties, eula.txt, และ ops.json...";
        else if (percent < 80) statusText.textContent = `กำลังตั้งค่า 5 vCPU และแรม ${newServerDraft.ram} MB...`;
        else statusText.textContent = "ติดตั้งสำเร็จ!";
    }, 400);
}

// --- 5. Dashboard ---
function openServerDashboard(id) {
    activeServerId = id;
    let srv = serversList.find(s => s.id === id);
    if (!srv) return;

    document.getElementById('server-list-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
    
    document.getElementById('panel-server-name').textContent = srv.name;
    document.getElementById('panel-server-info').textContent = `${srv.edition} | ${srv.loader} (${srv.version}) | ${srv.ram / 1024} GB RAM`;
    document.getElementById('display-max-ram').textContent = `${srv.ram} MB`;
    document.getElementById('ram-text').textContent = `0 MB / ${srv.ram} MB`;

    let formattedIp = srv.name.toLowerCase().replace(/\s+/g, '') + '.aternos.me';
    document.getElementById('server-ip-val').value = formattedIp;

    const portContainer = document.getElementById('port-box-container');
    if (srv.edition === 'Bedrock Edition' || srv.loader === 'Crossplay') {
        portContainer.style.display = 'block';
        document.getElementById('server-port-val').value = srv.edition === 'Bedrock Edition' ? '19132' : '25565 (Bedrock: 19132)';
    } else {
        portContainer.style.display = 'none';
    }

    initSoftwareOptions();
    switchTab('server');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.currentTarget.classList.add('active');
}

// --- 6. File Manager (3 ไฟล์หลัก) ---
function openFileEditor(filename) {
    currentEditingFile = filename;
    document.getElementById('editing-filename').textContent = `Editing: ${filename}`;
    document.getElementById('file-content-area').value = serverFiles[filename] || '';
    document.getElementById('file-editor-container').style.display = 'block';
}

function saveFileContent() {
    let newContent = document.getElementById('file-content-area').value;
    serverFiles[currentEditingFile] = newContent;
    alert(`บันทึกไฟล์ ${currentEditingFile} สำเร็จเรียบร้อยแล้ว!`);
}

// --- 7. Software Tab ---
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
    let srv = serversList.find(s => s.id === activeServerId);
    let statusBadge = document.getElementById('status-badge');
    if (statusBadge.classList.contains('online')) {
        alert("กรุณาปิดเซิร์ฟเวอร์ก่อนเปลี่ยนซอฟต์แวร์!");
        return;
    }
    srv.loader = document.getElementById('sw-type').value;
    srv.version = document.getElementById('sw-version').value;
    openServerDashboard(srv.id);
    alert("เปลี่ยนซอฟต์แวร์สำเร็จ!");
    switchTab('server');
}

// --- 8. Players Tab ---
function managePlayer(action) {
    let username = document.getElementById('target-player').value.trim();
    if (username === "") { alert("กรุณากรอกชื่อผู้เล่น"); return; }
    if (action === 'op') {
        log(`[Server] Made ${username} a server operator`);
        alert(`ให้สิทธิ์ OP แก่ ${username} แล้ว`);
    } else if (action === 'ban') {
        if (!bannedPlayers.includes(username)) {
            bannedPlayers.push(username);
            log(`[Server] Banned player ${username}`);
            updateBannedList();
            alert(`แบน ${username} เรียบร้อย`);
        }
    }
    document.getElementById('target-player').value = '';
}

function unbanPlayer(username) {
    bannedPlayers = bannedPlayers.filter(p => p !== username);
    log(`[Server] Unbanned ${username}`);
    updateBannedList();
    alert(`ปลดแบน ${username} แล้ว`);
}

function updateBannedList() {
    let listEl = document.getElementById('banned-list');
    listEl.innerHTML = bannedPlayers.length === 0 ? '<li>ไม่มีผู้เล่นที่ถูกแบน</li>' : '';
    bannedPlayers.forEach(player => {
        let li = document.createElement('li');
        li.innerHTML = `${player} <button class="unban-btn" onclick="unbanPlayer('${player}')">ปลดแบน</button>`;
        listEl.appendChild(li);
    });
}

// --- 9. Copy IP/Port ---
function copyText(elementId, msg) {
    let copyText = document.getElementById(elementId);
    navigator.clipboard.writeText(copyText.value).then(() => alert(msg));
}

// --- 10. Aternos Console & Server Simulation ---
const statusBadge = document.getElementById('status-badge');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const consoleOutput = document.getElementById('console-output');
const commandInput = document.getElementById('command-input');
const sendBtn = document.getElementById('send-btn');
const consoleStatusDot = document.getElementById('console-status-dot');

const cpuText = document.getElementById('cpu-text');
const cpuFill = document.getElementById('cpu-fill');
const ramText = document.getElementById('ram-text');
const ramFill = document.getElementById('ram-fill');

function log(msg) {
    consoleOutput.innerHTML += `<br>[${new Date().toLocaleTimeString()}] ${msg}`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function startMetricsSimulation() {
    let srv = serversList.find(s => s.id === activeServerId);
    metricsInterval = setInterval(() => {
        let randomCpu = Math.floor(Math.random() * 45) + 25;
        let randomRam = Math.floor(Math.random() * (srv.ram * 0.35)) + Math.floor(srv.ram * 0.5);
        let ramPercent = (randomRam / srv.ram) * 100;
        cpuText.textContent = randomCpu + "%";
        cpuFill.style.width = randomCpu + "%";
        ramText.textContent = `${randomRam} MB / ${srv.ram} MB`;
        ramFill.style.width = ramPercent + "%";
    }, 2000);
}

function stopMetricsSimulation() {
    clearInterval(metricsInterval);
    let srv = serversList.find(s => s.id === activeServerId);
    if (!srv) return;
    cpuText.textContent = "0%";
    cpuFill.style.width = "0%";
    ramText.textContent = `0 MB / ${srv.ram} MB`;
    ramFill.style.width = "0%";
}

// ฟังก์ชันจำลองการรัน Console สไตล์ Aternos ของจริง
function startServer() {
    let srv = serversList.find(s => s.id === activeServerId);
    startBtn.disabled = true;
    statusBadge.textContent = "Starting...";
    statusBadge.className = "offline";
    consoleStatusDot.className = "dot-offline";

    consoleOutput.innerHTML = `[Aternos] Preparing server for startup...`;
    log(`[Aternos Daemon] Pulling container image for ${srv.loader} (${srv.version})...`);

    setTimeout(() => {
        log(`[System] Setting up Java runtime environment on 5 vCPU / ${srv.ram} MB RAM...`);
        log(`[Forge/Bootstrap] Loading libraries from server directory...`);
    }, 1500);

    setTimeout(() => {
        log(`[Server thread/INFO]: Starting minecraft server version ${srv.version}`);
        log(`[Server thread/INFO]: Loading properties from server.properties`);
        log(`[Server thread/INFO]: Default game type: SURVIVAL`);
        log(`[Server thread/INFO]: Generating keypair`);
        log(`[Server thread/INFO]: Starting Minecraft server on *:25565`);
    }, 2800);

    setTimeout(() => {
        statusBadge.textContent = "Online";
        statusBadge.className = "online";
        consoleStatusDot.className = "dot-online";
        stopBtn.disabled = false;
        commandInput.disabled = false;
        sendBtn.disabled = false;
        
        log(`[Server thread/INFO]: Done (4.125s)! For help, type "help"`);
        startMetricsSimulation();
    }, 4500);
}

function stopServer() {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    commandInput.disabled = true;
    sendBtn.disabled = true;
    statusBadge.textContent = "Stopping...";
    consoleStatusDot.className = "dot-offline";
    
    log(`[Server thread/INFO]: Stopping the server...`);
    log(`[Server thread/INFO]: Saving chunks for level 'world'/Overworld`);
    log(`[Server thread/INFO]: ThreadedAnvilChunkStorage: All chunks saved`);

    stopMetricsSimulation();

    setTimeout(() => {
        statusBadge.textContent = "Offline";
        statusBadge.className = "offline";
        startBtn.disabled = false;
        log(`[Aternos] Server offline.`);
    }, 2500);
}

function resetServer() {
    let srv = serversList.find(s => s.id === activeServerId);
    if (confirm(`คุณแน่ใจหรือไม่ที่จะรีเซ็ตเซิร์ฟเวอร์ ${srv.name}?`)) {
        stopMetricsSimulation();
        statusBadge.textContent = "Offline";
        statusBadge.className = "offline";
        consoleStatusDot.className = "dot-offline";
        startBtn.disabled = false;
        stopBtn.disabled = true;
        commandInput.disabled = true;
        sendBtn.disabled = true;
        consoleOutput.innerHTML = "[Aternos] Server data cleared and reset to factory defaults.";
        alert("รีเซ็ตเซิร์ฟเวอร์เรียบร้อยแล้ว");
    }
}

function sendCommand() {
    let cmd = commandInput.value.trim();
    if (cmd === "") return;
    log(`> ${cmd}`);

    if (cmd === "help" || cmd === "/help") {
        log("[Server] Commands: help, save-all, stop, time set day, op <player>");
    } else if (cmd === "save-all" || cmd === "/save-all") {
        log("[Server thread/INFO]: Saved the game");
    } else if (cmd.startsWith("op ") || cmd.startsWith("/op ")) {
        let playerName = cmd.split(" ")[1];
        log(`[Server thread/INFO]: Made ${playerName} a server operator`);
    } else {
        log(`[Server thread/INFO]: Unknown command. Type "help" for help.`);
    }
    commandInput.value = "";
}

function checkEnter(event) {
    if (event.key === "Enter") {
        sendCommand();
    }
}
