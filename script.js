document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const waveNumEl = document.getElementById('waveNum');
  const scoreEl = document.getElementById('score');
  const healthEl = document.getElementById('health');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayDesc = document.getElementById('overlayDesc');
  const threatInfo = document.getElementById('threatInfo');
  const startBtn = document.getElementById('startBtn');
  const threatBanner = document.getElementById('threatBanner');

  let keys = {};
  let bullets = [];
  let enemies = [];
  let particles = [];
  let wave = 0;
  let score = 0;
  let player;
  let gameState = 'menu'; // menu, playing, paused, bossPrompt
  let boss = null;
  let bossPromptActive = false;

  const THREATS_DATA = [
    {"id":"phishing","category":"Classic Cyber Risk","threat":{"name":"Phishing Attack","iconId":"Mail","description":"Uses deceptive emails and fake websites to trick users into revealing sensitive credentials or personal data.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"Multi-Factor Auth (MFA)","iconId":"Smartphone","description":"Requires a second verification step (like a mobile token), ensuring that a stolen password alone is not enough to gain access.","color":"text-green-400","bg":"bg-green-500/20"}},
    {"id":"ransomware","category":"Classic Cyber Risk","threat":{"name":"Ransomware","iconId":"Bug","description":"Malicious software that encrypts a victim's files, with the attacker demanding a ransom to restore access.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"Immutable Backups","iconId":"Database","description":"Maintains data in a state that cannot be deleted or modified, allowing for full system restoration without paying attackers.","color":"text-blue-400","bg":"bg-blue-500/20"}},
    {"id":"cve_exploit","category":"Classic Cyber Risk","threat":{"name":"Software Vulnerability (CVE)","iconId":"Bomb","description":"Exploits known security flaws in software or hardware to gain unauthorized access or execute malicious code.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"Security Patch","iconId":"Wrench","description":"Updates provided by vendors to fix vulnerabilities, effectively closing the 'open doors' before they can be exploited.","color":"text-cyan-400","bg":"bg-cyan-500/20"}},
    {"id":"ddos","category":"Classic Cyber Risk","threat":{"name":"DDoS Attack","iconId":"CloudLightning","description":"Floods a target server or network with a massive volume of fake traffic to overwhelm resources and cause a service outage.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"Web App Firewall (WAF)","iconId":"Shield","description":"Monitors and filters incoming web traffic, identifying and blocking malicious patterns associated with botnets and DDoS attacks.","color":"text-purple-400","bg":"bg-purple-500/20"}},
    {"id":"prompt_injection","category":"Emerging AI Risk","threat":{"name":"Prompt Injection","iconId":"Terminal","description":"Manipulates an AI's behavior by embedding hidden commands within a prompt to bypass safety guardrails or leak data.","color":"text-orange-500","bg":"bg-orange-500/20"},"defense":{"name":"Input Sanitization","iconId":"FileCode2","description":"Cleans and validates user inputs to ensure that the AI treats text strictly as data rather than as executable instructions.","color":"text-emerald-400","bg":"bg-emerald-500/20"}},
    {"id":"deepfake_fraud","category":"Emerging AI Risk","threat":{"name":"Deepfake CEO Fraud","iconId":"UserX","description":"Uses AI-generated voice or video clones to impersonate executives and trick employees into making unauthorized wire transfers.","color":"text-orange-500","bg":"bg-orange-500/20"},"defense":{"name":"Cryptographic Identity","iconId":"Key","description":"Uses digital signatures and hardware keys to verify identity, moving beyond easily spoofed visual or audio confirmation.","color":"text-yellow-400","bg":"bg-yellow-500/20"}},
    {"id":"data_poisoning","category":"Emerging AI Risk","threat":{"name":"Training Data Poisoning","iconId":"FlaskConicalOff","description":"Corrupts the data used to train AI models, introducing subtle biases or 'backdoors' that attackers can trigger later.","color":"text-orange-500","bg":"bg-orange-500/20"},"defense":{"name":"Data Provenance","iconId":"FileSearch","description":"Tracks the origin and history of all training data, ensuring that only verified and uncompromised datasets are used for AI training.","color":"text-teal-400","bg":"bg-teal-500/20"}},
    {"id":"sql_injection","category":"Classic Cyber Risk","threat":{"name":"SQL Injection","iconId":"DatabaseZap","description":"Inserts malicious SQL code into input fields to manipulate backend databases and steal or destroy sensitive information.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"Parameterized Queries","iconId":"Code2","description":"Separates the SQL command from the user-supplied data, preventing the database from ever executing input as code.","color":"text-blue-400","bg":"bg-blue-500/20"}},
    {"id":"mitm","category":"Classic Cyber Risk","threat":{"name":"Man-in-the-Middle Attack","iconId":"GitMerge","description":"Secretly intercepts and potentially alters the communication between two parties who believe they are talking directly to each other.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"TLS/HTTPS Encryption","iconId":"Lock","description":"Encrypts data in transit and uses certificates to verify the identity of the server, making interception and tampering impossible.","color":"text-green-400","bg":"bg-green-500/20"}},
    {"id":"insider_threat","category":"Classic Cyber Risk","threat":{"name":"Insider Threat","iconId":"UserRoundX","description":"Occurs when someone with authorized access (like an employee) intentionally or accidentally compromises organizational security.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"Zero Trust Architecture","iconId":"ScanEye","description":"Operates on the principle of 'never trust, always verify,' requiring strict identity verification for every person and device.","color":"text-indigo-400","bg":"bg-indigo-500/20"}},
    {"id":"supply_chain","category":"Classic Cyber Risk","threat":{"name":"Supply Chain Attack","iconId":"PackageX","description":"Compromises a trusted third-party vendor or software library to distribute malware to all of that vendor's customers.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"Software Bill of Materials (SBOM)","iconId":"ListChecks","description":"A formal record containing the details and supply chain relationships of various components used in building software.","color":"text-cyan-400","bg":"bg-cyan-500/20"}},
    {"id":"password_spraying","category":"Classic Cyber Risk","threat":{"name":"Password Spraying","iconId":"KeyRound","description":"Attempts to log in to many different accounts using a few commonly used passwords to avoid account lockout policies.","color":"text-red-500","bg":"bg-red-500/20"},"defense":{"name":"Privileged Access Management (PAM)","iconId":"ShieldCheck","description":"Secures, manages, and monitors privileged account access, enforcing just-in-time permissions and multi-factor authentication.","color":"text-violet-400","bg":"bg-violet-500/20"}},
    {"id":"ai_model_theft","category":"Emerging AI Risk","threat":{"name":"AI Model Theft","iconId":"BrainCircuit","description":"Involves querying a proprietary AI model to reverse-engineer its logic and parameters, effectively stealing intellectual property.","color":"text-orange-500","bg":"bg-orange-500/20"},"defense":{"name":"Model Watermarking","iconId":"Fingerprint","description":"Embeds a unique, hidden identifier into the AI's outputs, allowing organizations to prove ownership if their model is stolen.","color":"text-pink-400","bg":"bg-pink-500/20"}},
    {"id":"shadow_ai","category":"Emerging AI Risk","threat":{"name":"Shadow AI Usage","iconId":"EyeOff","description":"The use of unauthorized AI tools by employees, which can lead to sensitive corporate data being leaked to third-party AI providers.","color":"text-orange-500","bg":"bg-orange-500/20"},"defense":{"name":"AI Governance Policy","iconId":"ScrollText","description":"Establishes clear rules for AI adoption, data handling, and security reviews to ensure all AI usage is visible and compliant.","color":"text-amber-400","bg":"bg-amber-500/20"}}
  ];

  const COLOR_MAP = {
    'text-red-500':'#ff6b6b',
    'text-orange-500':'#ff9f43',
    'text-green-400':'#2ec4b6',
    'text-blue-400':'#4da6ff',
    'text-cyan-400':'#2dd4bf',
    'text-purple-400':'#a78bfa',
    'text-yellow-400':'#ffd166',
    'text-pink-400':'#ff7ab6',
    'text-teal-400':'#14b8a6',
    'text-indigo-400':'#7c3aed',
    'text-violet-400':'#8b5cf6',
    'text-emerald-400':'#10b981',
    'text-amber-400':'#f59e0b'
  };

  function createPlayer(){ return { x: W/2, y: H-80, w: 40, h: 26, speed: 4.2, health: 100, color1:'#2ec44f', color2:'#1b38aa' }; }

  function spawnEnemy(threatObj, x, y, hp, speed, colorHex){
    return { x:x, y:y, r:18, threatObj:threatObj, hp:hp, maxHp:hp, speed:speed, angle:Math.random()*Math.PI*2, wobble:Math.random()*0.04+0.01, colorHex: colorHex || '#fff' };
  }

  function createBoss(){ return { x: W/2, y: 120, r:80, hp: 1200, maxHp:1200, vx:1.2, color:'#b4ff3c' }; }

  function drawPlayer(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.beginPath();
    ctx.moveTo(0,-p.h);
    ctx.lineTo(p.w/2, p.h/2);
    ctx.lineTo(0, p.h/4);
    ctx.lineTo(-p.w/2, p.h/2);
    ctx.closePath();
    ctx.fillStyle = p.color1;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -2, 9, 6, 0, 0, Math.PI*2);
    ctx.fillStyle = p.color2;
    ctx.fill();
    ctx.restore();
  }

  function drawEnemy(e){
    ctx.save();
    ctx.translate(e.x, e.y);
    const col = e.colorHex || COLOR_MAP[e.threatObj.threat.color] || '#fff';
    ctx.beginPath();
    ctx.fillStyle = col;
    ctx.arc(0,0,e.r,0,Math.PI*2);
    ctx.fill();
    const spikes = 10;
    for(let i=0;i<spikes;i++){
      const a = (i/spikes)*Math.PI*2 + e.angle;
      const sx = Math.cos(a)*(e.r+6);
      const sy = Math.sin(a)*(e.r+6);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*(e.r-2), Math.sin(a)*(e.r-2));
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = shadeColor(col, -20);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.fillStyle = '#001';
    ctx.beginPath(); ctx.arc(-6,-4,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(6,-4,3,0,Math.PI*2); ctx.fill();
    const hpW = 36;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-hpW/2, e.r+8, hpW, 6);
    ctx.fillStyle = '#2ec4b6';
    ctx.fillRect(-hpW/2, e.r+8, hpW*(e.hp/e.maxHp), 6);
    ctx.restore();
  }

  function shadeColor(hex, percent) {
    const f=parseInt(hex.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent;
    const R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    const newR = Math.round((t-R)*p/100)+R;
    const newG = Math.round((t-G)*p/100)+G;
    const newB = Math.round((t-B)*p/100)+B;
    return '#'+(0x1000000 + (newR<<16) + (newG<<8) + newB).toString(16).slice(1);
  }

  const waves = THREATS_DATA.map((t, idx) => {
    const baseCount = 6 + Math.floor(idx * 0.9);
    const baseHp = 16 + Math.floor(idx * 3);
    const speed = 1 + idx*0.12;
    return { title: t.threat.name, desc: t.threat.description, defense: t.defense, threatObj: t, count: baseCount, hp: baseHp, speed: speed };
  });

  const stars = [];
  for(let i=0;i<140;i++) stars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.6, a:Math.random()*0.8+0.2});
  function drawStarfield(){
    for(const s of stars){
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,'+s.a+')';
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
      s.x -= 0.25;
      if(s.x < -10) s.x = W + 10;
    }
  }

  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
  function spawnParticles(x,y,count,color){
    for(let i=0;i<count;i++){
      particles.push({ x:x, y:y, vx:(Math.random()-0.5)*6, vy:(Math.random()-0.9)*6, life:40 + Math.random()*30, color:color });
    }
  }
  function getSeverity(threatObj){
    return (threatObj.category && threatObj.category.includes('Emerging')) ? 4 : 3;
  }

  function showThreatBanner(threatObj){
    const name = threatObj.threat.name;
    const desc = threatObj.threat.description;
    const colorClass = threatObj.threat.color;
    const hex = COLOR_MAP[colorClass] || '#ffd166';
    threatBanner.textContent = `${name} — ${desc}`;
    threatBanner.style.background = hex + '33';
    threatBanner.style.color = '#021';
    threatBanner.classList.add('show');
    threatBanner.setAttribute('aria-hidden', 'false');
    clearTimeout(threatBanner._hideTimer);
    threatBanner._hideTimer = setTimeout(()=>{
      threatBanner.classList.remove('show');
      threatBanner.setAttribute('aria-hidden', 'true');
    }, 2200);
  }

  function init(){
    player = createPlayer();
    bullets = [];
    enemies = [];
    particles = [];
    wave = 0;
    score = 0;
    updateHUD();
    showNextWave();
  }

  function showNextWave(){
    wave++;
    waveNumEl.textContent = wave;
    if(wave <= waves.length){
      const w = waves[wave-1];
      overlayTitle.textContent = `Wave ${wave}: ${w.title}`;
      overlayDesc.textContent = w.desc;
      threatInfo.innerHTML = `<div style="margin-top:8px"><strong>Defense:</strong> ${w.defense.name} — ${w.defense.description}</div>`;
      overlay.style.display = 'block';
      gameState = 'menu';
      showThreatBanner(w.threatObj);
    } else {
      overlayTitle.textContent = 'Final Wave: Combined Threats';
      overlayDesc.textContent = 'All threats have converged into a single powerful entity. Use the mega-bullet when prompted.';
      threatInfo.innerHTML = '<div style="margin-top:8px"><strong>Defenses:</strong> Multiple defenses recommended.</div>';
      overlay.style.display = 'block';
      gameState = 'menu';
      showThreatBanner({ threat: { name: 'Combined Threats', description: 'All threats together — highest severity.', color: 'text-pink-400' } });
    }
  }

  function startWave(){
    overlay.style.display = 'none';
    bullets = [];
    enemies = [];
    boss = null;
    bossPromptActive = false;
    if(wave <= waves.length){
      const w = waves[wave-1];
      const cols = Math.min(10, Math.ceil(w.count/2));
      const waveColorHex = COLOR_MAP[w.threatObj.threat.color] || '#fff';
      for(let i=0;i<w.count;i++){
        const col = i % cols;
        const row = Math.floor(i/cols);
        const x = 80 + col * ((W-160)/cols) + (Math.random()*20-10);
        const y = -40 - row*60 + (Math.random()*20-10);
        enemies.push(spawnEnemy(w.threatObj, x, y, w.hp + Math.floor(Math.random()*6), w.speed + Math.random()*0.4, waveColorHex));
      }
      showThreatBanner(w.threatObj);
      gameState = 'playing';
    } else {
      boss = createBoss();
      boss.hp = 1200 + Math.floor(Math.random()*400);
      boss.maxHp = boss.hp;
      gameState = 'playing';
      showThreatBanner({ threat: { name: 'Combined Threats', description: 'Final boss — press Enter when prompted.', color: 'text-pink-400' } });
    }
  }

  // Toggle pause with P key
  function togglePause(){
    if(gameState === 'playing'){
      gameState = 'paused';
      overlayTitle.textContent = 'Paused';
      overlayDesc.textContent = 'Press P to resume the game.';
      threatInfo.innerHTML = '';
      overlay.style.display = 'block';
    } else if(gameState === 'paused'){
      overlay.style.display = 'none';
      gameState = 'playing';
    }
  }

  window.addEventListener('keydown', e=>{
    keys[e.code] = true;

   
    if(e.code === 'KeyP'){
      
      if(gameState === 'playing' || gameState === 'paused'){
        togglePause();
      }
      return;
    }

    if(e.code === 'Enter'){
      if(overlay.style.display === 'block' && gameState !== 'paused'){
        startWave();
      } else if(boss && bossPromptActive && gameState === 'playing'){
        fireMegaBullet();
      }
    }
    if(e.code === 'Space'){
      e.preventDefault();
      if(gameState === 'playing') fireBullet();
    }
  });
  window.addEventListener('keyup', e=>{ keys[e.code] = false; });

  function fireBullet(){ bullets.push({x:player.x, y:player.y-20, vx:0, vy:-9, r:4, dmg:14, color:'#9be7ff'}); }
  function fireMegaBullet(){
    if(!bossPromptActive) return;
    bullets.push({x:player.x, y:player.y-20, vx:0, vy:-11, r:16, dmg:400, color:'#ffd166', mega:true});
    bossPromptActive = false;
    spawnParticles(player.x, player.y-20, 40, '#ffd166');
  }

  function update(){
    
    if(gameState !== 'playing') return;

    if(keys['ArrowLeft']) player.x -= player.speed;
    if(keys['ArrowRight']) player.x += player.speed;
    if(keys['ArrowUp']) player.y -= player.speed;
    if(keys['ArrowDown']) player.y += player.speed;
    player.x = Math.max(20, Math.min(W-20, player.x));
    player.y = Math.max(60, Math.min(H-30, player.y));

    for(let i=bullets.length-1;i>=0;i--){
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy;
      if(b.y < -60 || b.y > H+60 || b.x < -60 || b.x > W+60) bullets.splice(i,1);
    }

    for(let i=enemies.length-1;i>=0;i--){
      const e = enemies[i];
      e.y += e.speed;
      e.angle += e.wobble;
      e.x += Math.sin(e.angle)*0.6;
      
      if(e.y - e.r > H){
        e.y = -e.r - (Math.random()*40);
        e.x = Math.max(40, Math.min(W-40, e.x + (Math.random()*80 - 40)));
        e.wobble = 0.01 + Math.random()*0.05;
      }

      if(dist(e, player) < e.r + 12){
        player.health -= 8;
        spawnParticles(e.x, e.y, 12, e.colorHex || COLOR_MAP[e.threatObj.threat.color] || '#fff');
        enemies.splice(i,1);
        if(player.health <= 0) endGame();
      }
    }

    if(boss){
      boss.x += boss.vx;
      boss.y += Math.sin(Date.now()/700)*1.2;
      if(boss.x < boss.r+20 || boss.x > W-boss.r-20) boss.vx *= -1;
      if(Math.random() < 0.02){
        const t = THREATS_DATA[Math.floor(Math.random()*THREATS_DATA.length)];
        enemies.push({ x:boss.x + (Math.random()-0.5)*120, y:boss.y+boss.r+10, r:12, threatObj:t, hp:10, maxHp:10, speed:2.6, angle:0, wobble:0.02, colorHex: COLOR_MAP[t.threat.color] || '#fff' });
      }
      if(!bossPromptActive && boss.hp < boss.maxHp * 0.35){
        bossPromptActive = true;
        showBossPrompt();
      }
      if(dist(boss, player) < boss.r + 12){
        player.health -= 20;
        spawnParticles(player.x, player.y, 30, '#ff6b6b');
        boss.hp -= 40;
        if(player.health <= 0) endGame();
      }
    }

    for(let i=bullets.length-1;i>=0;i--){
      const b = bullets[i];
      if(boss && dist(b, boss) < boss.r + b.r){
        boss.hp -= b.dmg;
        spawnParticles(b.x, b.y, b.mega ? 40 : 8, b.color);
        bullets.splice(i,1);
        score += b.mega ? 600 : 40;
        continue;
      }
      for(let j=enemies.length-1;j>=0;j--){
        const e = enemies[j];
        if(dist(b, e) < e.r + b.r){
          e.hp -= b.dmg;
          spawnParticles(b.x, b.y, 6, b.color);
          bullets.splice(i,1);
          if(e.hp <= 0){
            score += 20 + (getSeverity(e.threatObj)*8);
            spawnParticles(e.x, e.y, 18, e.colorHex || COLOR_MAP[e.threatObj.threat.color] || '#fff');
            enemies.splice(j,1);
          }
          break;
        }
      }
    }

    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.12;
      p.life--;
      if(p.life <= 0) particles.splice(i,1);
    }

    if(boss){
      if(boss.hp <= 0){
        score += 3000;
        spawnParticles(boss.x, boss.y, 160, '#ffd166');
        boss = null;
        gameState = 'menu';
        overlayTitle.textContent = 'Victory!';
        overlayDesc.textContent = 'You destroyed the combined threat. Well done.';
        threatInfo.innerHTML = '<div class="small">Final Score: <strong>' + score + '</strong></div>';
        overlay.style.display = 'block';
      }
    } else {
      if(enemies.length === 0 && gameState === 'playing'){
        gameState = 'menu';
        overlayTitle.textContent = 'Wave Cleared';
        overlayDesc.textContent = 'You cleared the wave. Prepare for the next threat.';
        threatInfo.innerHTML = '<div class="small">Score: <strong>' + score + '</strong></div>';
        overlay.style.display = 'block';
        setTimeout(showNextWave, 300);
      }
    }

    updateHUD();
  }

  function showBossPrompt(){
    overlayTitle.textContent = 'Boss Vulnerable';
    overlayDesc.textContent = 'The boss is vulnerable. Press Enter to fire the mega-bullet and finish it!';
    threatInfo.innerHTML = '<div class="small">Mega-bullet deals massive damage. Use it now.</div>';
    overlay.style.display = 'block';
    setTimeout(()=>{ if(overlayTitle.textContent.startsWith('Boss')) overlay.style.display = 'none'; }, 4200);
  }

  function endGame(){
    gameState = 'menu';
    overlayTitle.textContent = 'Game Over';
    overlayDesc.textContent = 'Your ship was destroyed. Refresh to play again or press Start to restart.';
    threatInfo.innerHTML = '<div class="small">Final Score: <strong>' + score + '</strong></div>';
    overlay.style.display = 'block';
    wave = 0;
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    drawStarfield();
    drawPlayer(player);
    for(const b of bullets){
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
      if(b.mega){
        ctx.beginPath();
        ctx.strokeStyle = '#fff3';
        ctx.lineWidth = 2;
        ctx.arc(b.x, b.y, b.r+6, 0, Math.PI*2);
        ctx.stroke();
      }
    }
    for(const e of enemies) drawEnemy(e);
    if(boss){
      ctx.save();
      ctx.translate(boss.x, boss.y);
      const pulse = 1 + Math.sin(Date.now()/300)/12;
      ctx.beginPath();
      ctx.fillStyle = boss.color;
      ctx.arc(0,0,boss.r*pulse,0,Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = '#fff3';
      ctx.lineWidth = 2;
      ctx.arc(0,0,boss.r*0.6,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
      const bw = 560;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect((W-bw)/2, 18, bw, 12);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect((W-bw)/2, 18, bw*(boss.hp/boss.maxHp), 12);
      ctx.strokeStyle = '#fff2';
      ctx.strokeRect((W-bw)/2, 18, bw, 12);
    }
    for(const p of particles){
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life/60);
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(8, H-48, 260, 36);
    ctx.fillStyle = '#fff8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Threats Remaining: ' + (boss ? 'Boss' : enemies.length), 16, H-26);
  }

  function updateHUD(){
    waveNumEl.textContent = Math.max(0,wave);
    scoreEl.textContent = score;
    healthEl.textContent = Math.max(0, Math.round(player.health));
  }

  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click', ()=>{
    if(overlayTitle.textContent === 'Game Over'){
      player = createPlayer();
      player.health = 100;
      score = 0;
      wave = 0;
      overlay.style.display = 'none';
      showNextWave();
    } else {
      startWave();
    }
  });

  init();
  loop();
});
