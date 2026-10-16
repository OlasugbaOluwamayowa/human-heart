// The Human Heart: interactive parts.

// ---------- 1. Left-Popping Sidebar Navigation ----------
var menuBtn = document.getElementById("menuBtn");
var closeSidebarBtn = document.getElementById("closeSidebarBtn");
var sidebar = document.getElementById("sidebar");
var sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
  sidebar.classList.add("active");
  sidebarOverlay.classList.add("active");
  document.body.classList.add("sidebar-open");
  if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
  document.body.classList.remove("sidebar-open");
  if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
}

if (menuBtn) menuBtn.addEventListener("click", openSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

var sidebarLinks = sidebar.querySelectorAll("a");
for (var i = 0; i < sidebarLinks.length; i++) {
  sidebarLinks[i].addEventListener("click", closeSidebar);
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && sidebar.classList.contains("active")) {
    closeSidebar();
  }
});

// ---------- 2. Realistic Anatomical 3D Heart (Three.js) ----------
(function init3DHeart() {
  var container = document.getElementById("heart3d-container");
  if (!container || typeof THREE === "undefined") return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.5, 4.6);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 7;
  controls.minDistance = 2.4;
  controls.enablePan = false;

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  var mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
  mainLight.position.set(4, 6, 5);
  scene.add(mainLight);

  var rimLight = new THREE.DirectionalLight(0xff9999, 0.4);
  rimLight.position.set(-5, -2, -4);
  scene.add(rimLight);

  var heartAssembly = new THREE.Group();
  scene.add(heartAssembly);

  // Procedural Muscle Texture Generator
  var canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#8b1824";
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "#a7202e";
  ctx.lineWidth = 2;
  for (var i = 0; i < 200; i++) {
    ctx.beginPath();
    var x = Math.random() * 512;
    var y = Math.random() * 512;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 20, y + 40, x - 20, y + 80, x + 10, y + 120);
    ctx.stroke();
  }
  var muscleTexture = new THREE.CanvasTexture(canvas);

  var myocardiumMat = new THREE.MeshStandardMaterial({
    map: muscleTexture,
    color: 0x991f2c,
    roughness: 0.38,
    metalness: 0.08,
    bumpMap: muscleTexture,
    bumpScale: 0.03
  });

  var aortaMat = new THREE.MeshStandardMaterial({
    color: 0xc1272d,
    roughness: 0.3,
    metalness: 0.1
  });

  var veinMat = new THREE.MeshStandardMaterial({
    color: 0x2455a0,
    roughness: 0.35,
    metalness: 0.1
  });

  // Sculpted Ventricles
  var ventGeo = new THREE.SphereGeometry(1.05, 48, 48);
  var pos = ventGeo.attributes.position;
  var v = new THREE.Vector3();

  for (var i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    if (v.y < 0.2) {
      var taper = 1.0 - (0.2 - v.y) * 0.55;
      v.x *= taper;
      v.z *= taper;
    }
    if (v.y < -0.6) {
      v.x -= 0.22 * Math.abs(v.y);
      v.z += 0.15 * Math.abs(v.y);
    }
    if (v.x < 0 && v.y > -0.5) {
      v.x *= 1.15;
    }
    if (Math.abs(v.x + 0.05) < 0.25 && v.z > 0.4 && v.y < 0.3 && v.y > -0.7) {
      v.z *= 0.88;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  ventGeo.computeVertexNormals();

  var ventricles = new THREE.Mesh(ventGeo, myocardiumMat);
  ventricles.position.set(0, -0.15, 0);
  heartAssembly.add(ventricles);

  // Atria
  var rightAtriumGeo = new THREE.SphereGeometry(0.55, 24, 24);
  rightAtriumGeo.scale(1.1, 0.9, 0.85);
  var rightAtrium = new THREE.Mesh(rightAtriumGeo, myocardiumMat);
  rightAtrium.position.set(0.65, 0.72, -0.05);
  heartAssembly.add(rightAtrium);

  var leftAtriumGeo = new THREE.SphereGeometry(0.52, 24, 24);
  leftAtriumGeo.scale(1.0, 0.85, 0.9);
  var leftAtrium = new THREE.Mesh(leftAtriumGeo, myocardiumMat);
  leftAtrium.position.set(-0.48, 0.78, -0.25);
  heartAssembly.add(leftAtrium);

  // Aortic Arch with Cranial Branches
  var aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.35, 0.1),
    new THREE.Vector3(0.1, 0.9, 0.15),
    new THREE.Vector3(-0.05, 1.35, 0.0),
    new THREE.Vector3(-0.45, 1.25, -0.25),
    new THREE.Vector3(-0.55, 0.6, -0.35)
  ]);
  var aortaGeo = new THREE.TubeGeometry(aortaCurve, 36, 0.22, 18, false);
  var aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
  heartAssembly.add(aortaMesh);

  var branchOffsets = [
    { x: 0.06, y: 1.32, z: 0.08, rot: 0.1 },
    { x: -0.12, y: 1.38, z: -0.05, rot: -0.05 },
    { x: -0.28, y: 1.33, z: -0.18, rot: -0.2 }
  ];
  branchOffsets.forEach(function (b) {
    var branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.35, 12),
      aortaMat
    );
    branch.position.set(b.x, b.y + 0.12, b.z);
    branch.rotation.z = b.rot;
    heartAssembly.add(branch);
  });

  // Pulmonary Trunk & Branches
  var pulmoCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.25, 0.45),
    new THREE.Vector3(0.05, 0.75, 0.42),
    new THREE.Vector3(-0.18, 0.98, 0.15)
  ]);
  var pulmoGeo = new THREE.TubeGeometry(pulmoCurve, 24, 0.18, 16, false);
  var pulmoMesh = new THREE.Mesh(pulmoGeo, veinMat);
  heartAssembly.add(pulmoMesh);

  var rpaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.98, 0.15),
    new THREE.Vector3(0.45, 0.92, -0.3)
  ]);
  heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(rpaCurve, 12, 0.11, 12, false), veinMat));

  var lpaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.98, 0.15),
    new THREE.Vector3(-0.65, 0.95, -0.2)
  ]);
  heartAssembly.add(new THREE.Mesh(new THREE.TubeGeometry(lpaCurve, 12, 0.11, 12, false), veinMat));

  // Vena Cava
  var svc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.65, 14), veinMat);
  svc.position.set(0.75, 1.2, -0.1);
  heartAssembly.add(svc);

  var ivc = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 14), veinMat);
  ivc.position.set(0.68, -0.5, -0.2);
  heartAssembly.add(ivc);

  // Coronary Vessels
  var ladCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.5, 0.75),
    new THREE.Vector3(-0.05, 0.1, 0.95),
    new THREE.Vector3(-0.12, -0.3, 0.82),
    new THREE.Vector3(-0.25, -0.75, 0.55),
    new THREE.Vector3(-0.35, -1.05, 0.28)
  ]);
  var ladArtery = new THREE.Mesh(
    new THREE.TubeGeometry(ladCurve, 32, 0.025, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.3 })
  );
  heartAssembly.add(ladArtery);

  var cardiacVeinCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, 0.45, 0.75),
    new THREE.Vector3(0.02, 0.08, 0.94),
    new THREE.Vector3(-0.06, -0.32, 0.81),
    new THREE.Vector3(-0.2, -0.74, 0.54)
  ]);
  var cardiacVein = new THREE.Mesh(
    new THREE.TubeGeometry(cardiacVeinCurve, 24, 0.022, 8, false),
    new THREE.MeshStandardMaterial({ color: 0x3d74d8, roughness: 0.3 })
  );
  heartAssembly.add(cardiacVein);

  // Initial Orientation
  heartAssembly.rotation.x = 0.18;
  heartAssembly.rotation.y = -0.45;
  heartAssembly.rotation.z = -0.05;

  var pulseActive = true;
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    if (pulseActive) {
      var beat = Math.pow(Math.sin(t * 4.2), 63);
      var subBeat = Math.pow(Math.sin(t * 4.2 + 0.35), 63) * 0.45;
      var impulse = (beat + subBeat) * 0.07;

      ventricles.scale.set(1.0 + impulse * 0.6, 1.0 - impulse * 0.8, 1.0 + impulse * 0.6);
      rightAtrium.scale.set(1.0 - impulse * 0.5, 1.0 + impulse * 0.4, 1.0 - impulse * 0.5);
      leftAtrium.scale.set(1.0 - impulse * 0.5, 1.0 + impulse * 0.4, 1.0 - impulse * 0.5);
    } else {
      ventricles.scale.set(1, 1, 1);
      rightAtrium.scale.set(1, 1, 1);
      leftAtrium.scale.set(1, 1, 1);
    }

    heartAssembly.rotation.y += 0.0025;

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  var toggleBtn = document.getElementById("toggleBeatBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      pulseActive = !pulseActive;
      this.textContent = pulseActive ? "Pulse: On" : "Pulse: Off";
    });
  }

  var resetBtn = document.getElementById("resetViewBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      controls.reset();
      camera.position.set(0, 0.5, 4.6);
      heartAssembly.rotation.set(0.18, -0.45, -0.05);
    });
  }

  window.addEventListener("resize", function () {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
})();

// ---------- 3. Circulation Buttons (Left-Aligned) ----------
var steps = document.querySelectorAll("#steps li");
var circText = document.getElementById("circText");

function highlight(start, end, message) {
  for (var i = 0; i < steps.length; i++) {
    if (i >= start && i <= end) {
      steps[i].classList.add("on");
    } else {
      steps[i].classList.remove("on");
    }
  }
  circText.textContent = message;
}

document.getElementById("pulmonaryBtn").addEventListener("click", function () {
  highlight(4, 8, "Pulmonary circulation: the right ventricle pumps oxygen-poor blood to the lungs, and oxygen-rich blood returns by the pulmonary veins.");
});

document.getElementById("systemicBtn").addEventListener("click", function () {
  highlight(11, 13, "Systemic circulation: the left ventricle pumps oxygen-rich blood into the aorta to supply the body. Blood returns through the venae cavae.");
});

// ---------- 4. Cardiac Cycle (Buttons on the Right) ----------
var phases = [
  ["Atrial contraction", "The atria contract and push a final bit of blood into the ventricles.", true, false],
  ["Isovolumetric contraction", "The ventricles start to contract. Pressure rises, the AV valves close, and all valves are shut for a moment.", false, false],
  ["Ventricular ejection", "Ventricular pressure becomes higher than in the aorta and pulmonary trunk, so the semilunar valves open and blood is pumped out.", false, true],
  ["Isovolumetric relaxation", "The ventricles relax. Pressure falls, the semilunar valves close, and all valves are briefly shut.", false, false],
  ["Early ventricular filling", "Ventricular pressure drops below atrial pressure, the AV valves open, and blood flows in.", true, false],
  ["Ventricular filling", "Blood keeps flowing in slowly until the atria contract again.", true, false]
];

var current = 0;
var timer = null;

function setBadge(id, name, isOpen) {
  var badge = document.getElementById(id);
  badge.textContent = name + ": " + (isOpen ? "OPEN" : "CLOSED");
  badge.className = "badge " + (isOpen ? "open" : "closed");
}

function showPhase() {
  var p = phases[current];
  document.getElementById("phaseNumber").textContent = "PHASE " + (current + 1) + " OF " + phases.length;
  document.getElementById("phaseTitle").textContent = p[0];
  document.getElementById("phaseText").textContent = p[1];
  setBadge("avValves", "AV valves", p[2]);
  setBadge("slValves", "Semilunar valves", p[3]);
}

function nextPhase() {
  current = (current + 1) % phases.length;
  showPhase();
}

document.getElementById("nextBtn").addEventListener("click", nextPhase);

document.getElementById("prevBtn").addEventListener("click", function () {
  current = (current - 1 + phases.length) % phases.length;
  showPhase();
});

document.getElementById("playBtn").addEventListener("click", function () {
  if (timer === null) {
    timer = setInterval(nextPhase, 3500);
    this.textContent = "Pause";
  } else {
    clearInterval(timer);
    timer = null;
    this.textContent = "Play";
  }
});

showPhase();

// ---------- 5. Cardiac Output Calculator (Buttons on the Right) ----------
document.getElementById("calcBtn").addEventListener("click", function () {
  var hr = Number(document.getElementById("hr").value);
  var sv = Number(document.getElementById("sv").value);
  var result = document.getElementById("result");

  if (isNaN(hr) || isNaN(sv) || hr <= 0 || sv <= 0) {
    result.textContent = "Please enter positive numbers in both boxes.";
    return;
  }
  var ml = hr * sv;
  result.textContent = hr + " × " + sv + " = " + ml + " mL/min (" + (ml / 1000).toFixed(2) + " L/min). What counts as healthy depends on the person and the situation.";
});

document.getElementById("resetBtn").addEventListener("click", function () {
  document.getElementById("hr").value = 72;
  document.getElementById("sv").value = 70;
  document.getElementById("result").textContent = "";
});

// ---------- 6. Quiz (Buttons on the Right) ----------
var questions = [
  ["Which chamber pumps blood into the aorta?", ["Right atrium", "Right ventricle", "Left atrium", "Left ventricle"], 3, "The left ventricle sends oxygen-rich blood into the aorta."],
  ["Which vessels bring oxygen-rich blood to the left atrium?", ["Pulmonary veins", "Pulmonary arteries", "Venae cavae", "Aorta"], 0, "Pulmonary veins return blood from the lungs."],
  ["Which valve is between the left atrium and left ventricle?", ["Tricuspid", "Mitral", "Aortic", "Pulmonary"], 1, "That is the mitral (bicuspid) valve."],
  ["What mainly makes heart valves open and close?", ["Their own muscles", "Nerve signals", "Pressure differences", "Breathing"], 2, "Valves are passive and move because of pressure differences."],
  ["Why is the left ventricle wall thicker?", ["It holds more blood", "It creates higher pressure for the body", "It has more valves", "It is older"], 1, "It must push blood around the whole body."],
  ["Pulmonary arteries carry:", ["Oxygen-rich blood to the lungs", "Oxygen-poor blood to the lungs", "Oxygen-poor blood to the body", "Oxygen-rich blood to the heart"], 1, "Arteries carry blood away from the heart; here that blood is oxygen-poor."],
  ["Which structure normally starts the heartbeat?", ["AV node", "Purkinje fibres", "SA node", "Bundle of His"], 2, "The sinoatrial node is the natural pacemaker."],
  ["Where is the electrical signal slowed down?", ["SA node", "AV node", "Purkinje fibres", "Bundle branches"], 1, "The delay gives the ventricles time to fill."],
  ["The QRS complex on an ECG shows:", ["Atria activating", "Ventricles activating", "Ventricles recovering", "Valves closing"], 1, "QRS is ventricular depolarization."],
  ["Cardiac output equals:", ["HR + SV", "HR × SV", "HR − SV", "SV / HR"], 1, "Heart rate multiplied by stroke volume."]
];

var qNumber = 0;
var score = 0;
var answered = false;
var quizBox = document.getElementById("quizBox");

function showQuestion() {
  if (qNumber >= questions.length) {
    quizBox.innerHTML =
      "<h3>Your score: " + score + " / " + questions.length + "</h3>" +
      '<div class="button-group right"><button class="button" id="restartBtn">Restart Quiz</button></div>';
    document.getElementById("restartBtn").addEventListener("click", function () {
      qNumber = 0;
      score = 0;
      showQuestion();
    });
    return;
  }

  answered = false;
  var q = questions[qNumber];
  var html = '<p class="label">QUESTION ' + (qNumber + 1) + " OF " + questions.length + " &bull; SCORE " + score + "</p><h3>" + q[0] + "</h3>";

  for (var i = 0; i < q[1].length; i++) {
    html += '<button class="option" data-number="' + i + '">' + q[1][i] + "</button>";
  }

  html += '<p id="feedback"></p><div class="button-group right"><button class="button" id="nextQ" hidden>Next</button></div>';
  quizBox.innerHTML = html;

  var options = quizBox.querySelectorAll(".option");
  for (var j = 0; j < options.length; j++) {
    options[j].addEventListener("click", checkAnswer);
  }

  document.getElementById("nextQ").addEventListener("click", function () {
    qNumber++;
    showQuestion();
  });
}

function checkAnswer() {
  if (answered) { return; }
  answered = true;
  var q = questions[qNumber];
  var chosen = Number(this.dataset.number);
  var options = quizBox.querySelectorAll(".option");

  for (var i = 0; i < options.length; i++) {
    options[i].disabled = true;
    if (i === q[2]) { options[i].classList.add("right"); }
  }

  if (chosen === q[2]) {
    score++;
    document.getElementById("feedback").textContent = "Correct! " + q[3];
  } else {
    this.classList.add("wrong");
    document.getElementById("feedback").textContent = "Not quite. " + q[3];
  }
  document.getElementById("nextQ").hidden = false;
}

showQuestion();

// ---------- 7. Glossary Search ----------
var glossary = [
  ["Atrium", "An upper chamber that receives blood."],
  ["Ventricle", "A lower chamber that pumps blood out."],
  ["Myocardium", "The heart muscle that creates the pumping force."],
  ["Endocardium", "The smooth inner lining of the heart."],
  ["Epicardium", "The thin outer layer of the heart wall."],
  ["Pericardium", "The protective sac around the heart."],
  ["Systole", "The contraction phase."],
  ["Diastole", "The relaxation and filling phase."],
  ["Stroke volume", "Blood pumped out by a ventricle in one beat."],
  ["Cardiac output", "Blood pumped per minute (heart rate × stroke volume)."],
  ["Preload", "How much the ventricle is stretched before it contracts."],
  ["Afterload", "The resistance the ventricle pumps against."],
  ["Contractility", "The strength of the heart muscle's contraction."],
  ["Depolarization", "The electrical change that triggers contraction."],
  ["Repolarization", "The return to the resting electrical state."],
  ["Arrhythmia", "An abnormal heart rhythm."],
  ["Pulmonary circulation", "Blood flow between the heart and lungs."],
  ["Systemic circulation", "Blood flow between the heart and the body."]
];

function showGlossary(filter) {
  var html = "";
  var found = 0;
  for (var i = 0; i < glossary.length; i++) {
    var text = (glossary[i][0] + " " + glossary[i][1]).toLowerCase();
    if (text.indexOf(filter.toLowerCase()) !== -1) {
      html += "<dt>" + glossary[i][0] + "</dt><dd>" + glossary[i][1] + "</dd>";
      found++;
    }
  }
  document.getElementById("glossaryList").innerHTML = html;
  document.getElementById("noResults").hidden = found > 0;
}

document.getElementById("search").addEventListener("input", function () {
  showGlossary(this.value);
});

showGlossary("");

// ---------- 8. Footer Year ----------
document.getElementById("year").textContent = new Date().getFullYear();