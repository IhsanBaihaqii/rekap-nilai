/* THEME TOGGLE LOGIC */
const html = document.documentElement;
const btn = document.getElementById("themeToggle");
const DARK = "dark";
const LIGHT = "light";

// Restore saved preference
const saved = localStorage.getItem("theme") || LIGHT;
setTheme(saved, false);

btn.addEventListener("click", () => {
  const next = html.getAttribute("data-theme") === DARK ? LIGHT : DARK;
  setTheme(next, true);
});

function setTheme(theme, animate) {
  html.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  btn.setAttribute("data-tooltip", theme === DARK ? "Light Mode" : "Dark Mode");

  if (animate) {
    btn.classList.add("switching");
    setTimeout(() => btn.classList.remove("switching"), 400);
  }

  // Rebuild charts with updated colors after theme switch
  if (animate && lastDataObj) {
    setTimeout(() => renderUI(lastDataObj), 50);
  }
}

//  CHART.JS DEFAULTS

function getChartDefaults() {
  const dark = html.getAttribute("data-theme") === DARK;
  return {
    color: dark ? "#8b98b8" : "#94a3b8",
    borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    gridColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    pointBorder: dark ? "#0a0f1e" : "#ffffff",
  };
}

function getColors() {
  const dark = html.getAttribute("data-theme") === DARK;
  return {
    blue: dark ? "#4f8ef7" : "#3b82f6",
    indigo: dark ? "#818cf8" : "#6366f1",
    green: dark ? "#34d399" : "#10b981",
    amber: dark ? "#fbbf24" : "#f59e0b",
    rose: dark ? "#fb7185" : "#f43f5e",
    purple: dark ? "#a78bfa" : "#8b5cf6",
  };
}

//  DATA PROCESSING
function processData(inputData) {
  const rows = inputData
    .trim()
    .split("\n")
    .filter((r) => r.trim() !== "" && /^\d/.test(r.trim()));
  const grouped = {};
  let totalAllSKS = 0,
    totalAllBobot = 0;

  rows.forEach((row) => {
    const cols = row.split("\t");
    if (cols.length < 8) return;
    if (!/^\d+$/.test(cols[0].trim())) return;
    if (
      isNaN(cols[0]) ||
      isNaN(cols[3]) ||
      isNaN(cols[4]) ||
      isNaN(cols[7].replace(",", "."))
    )
      return;

    const semester = cols[3];
    const sks = parseFloat(cols[4]);
    const bobot = parseFloat(cols[7].replace(",", "."));

    if (!grouped[semester])
      grouped[semester] = { data: [], totalSKS: 0, totalBobot: 0 };
    grouped[semester].data.push(cols);
    grouped[semester].totalSKS += sks;
    grouped[semester].totalBobot += bobot;
    totalAllSKS += sks;
    totalAllBobot += bobot;
  });

  const semesters = Object.keys(grouped).sort((a, b) => a - b);
  const semesterData = semesters.map((sem) => {
    const d = grouped[sem];
    return {
      semester: sem,
      ip: d.totalBobot / d.totalSKS,
      totalSKS: d.totalSKS,
      totalBobot: d.totalBobot,
      totalMK: d.data.length,
      totalA: d.data.filter((r) => r[5].trim() === "A").length,
      totalB: d.data.filter((r) => r[5].trim() === "B").length,
    };
  });

  const ipk = totalAllBobot / totalAllSKS;
  const totalMK = rows.length;
  const totalGradeA = rows.filter(
    (r) => r.split("\t")[5].trim() === "A",
  ).length;
  const totalGradeB = rows.filter(
    (r) => r.split("\t")[5].trim() === "B",
  ).length;

  return {
    grouped,
    semesters,
    semesterData,
    totalAllSKS,
    totalAllBobot,
    ipk,
    totalMK,
    totalGradeA,
    totalGradeB,
  };
}

//  CHART HELPERS
const chartInstances = {};
function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}
function makeChart(id, config) {
  destroyChart(id);
  const ctx = document.getElementById(id);
  if (!ctx) return;
  chartInstances[id] = new Chart(ctx, config);
}

//  RENDER UI
let lastDataObj = null;

function renderUI(dataObj) {
  lastDataObj = dataObj;
  const {
    grouped,
    semesters,
    semesterData,
    totalAllSKS,
    ipk,
    totalMK,
    totalGradeA,
    totalGradeB,
  } = dataObj;

  document.getElementById("stat-cards").innerHTML = "";
  document.getElementById("charts").innerHTML = "";
  document.getElementById("container").innerHTML = "";
  document.getElementById("final").innerHTML = "";

  if (!semesters.length) return;

  const C = getColors();
  const D = getChartDefaults();

  Chart.defaults.color = D.color;
  Chart.defaults.borderColor = D.borderColor;
  Chart.defaults.font.family = "'JetBrains Mono', monospace";
  Chart.defaults.font.size = 11;

  const ipMax = Math.max(...semesterData.map((d) => d.ip));
  const ipMin = Math.min(...semesterData.map((d) => d.ip));
  const semMax = semesterData.find((d) => d.ip === ipMax)?.semester || "-";
  const semMin = semesterData.find((d) => d.ip === ipMin)?.semester || "-";

  /* ─ STAT CARDS ─ */
  document.getElementById("stat-cards").innerHTML = `
          <div class="stat-grid">
            <div class="stat-card fadeup">
              <div class="stat-icon"><i class="fa-solid fa-book-open"></i></div>
              <div class="stat-title">Total SKS</div>
              <div class="stat-value">${totalAllSKS.toFixed(0)}</div>
              <div class="stat-sub">~${(totalAllSKS / semesters.length).toFixed(1)} SKS / semester</div>
            </div>
            <div class="stat-card fadeup">
              <div class="stat-icon"><i class="fa-solid fa-bullseye"></i></div>
              <div class="stat-title">IPK</div>
              <div class="stat-value">${ipk.toFixed(2)}</div>
              <div class="stat-sub">${ipk >= 3.5 ? "✦ Cum Laude" : ipk >= 3.0 ? "Sangat Memuaskan" : "Memuaskan"}</div>
            </div>
            <div class="stat-card fadeup">
              <div class="stat-icon"><i class="fa-solid fa-trophy"></i></div>
              <div class="stat-title">IP Tertinggi</div>
              <div class="stat-value">${ipMax.toFixed(2)}</div>
              <div class="stat-sub">Semester ${semMax}</div>
            </div>
            <div class="stat-card fadeup">
              <div class="stat-icon"><i class="fa-solid fa-chart-line fa-flip-vertical"></i></div>
              <div class="stat-title">IP Terendah</div>
              <div class="stat-value">${ipMin.toFixed(2)}</div>
              <div class="stat-sub">Semester ${semMin}</div>
            </div>
          </div>
        `;

  const labels = semesterData.map((d) => `Sem ${d.semester}`);

  /* ─ CHARTS SECTION ─ */
  document.getElementById("charts").innerHTML = `
          <div class="chart-section" style="margin-bottom:16px">
            <div class="chart-section-header">
              <div class="chart-section-title">
                <i class="fa-solid fa-chart-line" style="color:${C.blue}"></i> Tren IPS & IPK
              </div>
              <div class="chart-legend">
                <div class="legend-item"><div class="legend-dot" style="background:${C.blue}"></div>IPS</div>
                <div class="legend-item"><div class="legend-dot" style="background:${C.rose}"></div>IPK</div>
              </div>
            </div>
            <div class="charts-grid">
              <div class="chart-box">
                <div class="chart-box-title">IPS & IPK per Semester</div>
                <div class="chart-wrapper"><canvas id="ipkChart"></canvas></div>
              </div>
              <div class="chart-box">
                <div class="chart-box-title">SKS & Jumlah MK</div>
                <div class="chart-wrapper"><canvas id="mapelChart"></canvas></div>
              </div>
            </div>
          </div>

          <div class="chart-section" style="margin-bottom:24px">
            <div class="chart-section-header">
              <div class="chart-section-title">
                <i class="fa-solid fa-chart-bar" style="color:${C.green}"></i> Distribusi Nilai
              </div>
              <div class="chart-legend">
                <div class="legend-item"><div class="legend-dot" style="background:${C.green}"></div>Nilai A</div>
                <div class="legend-item"><div class="legend-dot" style="background:${C.amber}"></div>Nilai B</div>
              </div>
            </div>
            <div class="charts-grid">
              <div class="chart-box">
                <div class="chart-box-title">Bar Chart A & B</div>
                <div class="chart-wrapper"><canvas id="gradeChart"></canvas></div>
              </div>
              <div class="chart-box">
                <div class="chart-box-title">Line Chart A & B</div>
                <div class="chart-wrapper"><canvas id="sksChart"></canvas></div>
              </div>
            </div>
          </div>
        `;

  const sharedOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: D.gridColor }, ticks: { maxRotation: 45 } },
      y: { grid: { color: D.gridColor } },
    },
  };

  let cumBobot = 0,
    cumSKS = 0;
  const ipkLine = semesterData.map((d) => {
    cumBobot += d.totalBobot;
    cumSKS += d.totalSKS;
    return parseFloat((cumBobot / cumSKS).toFixed(3));
  });

  makeChart("ipkChart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "IPS",
          data: semesterData.map((d) => parseFloat(d.ip.toFixed(3))),
          borderColor: C.blue,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: C.blue,
          pointBorderColor: D.pointBorder,
          pointBorderWidth: 2,
        },
        {
          label: "IPK",
          data: ipkLine,
          borderColor: C.rose,
          tension: 0.4,
          fill: true,
          borderDash: [5, 4],
          pointRadius: 4,
          pointBackgroundColor: C.rose,
          pointBorderColor: D.pointBorder,
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      ...sharedOpts,
      scales: {
        x: { grid: { color: D.gridColor }, ticks: { maxRotation: 45 } },
        y: {
          min: 0,
          max: 4.0,
          grid: { color: D.gridColor },
          ticks: { stepSize: 0.5 },
        },
      },
    },
  });

  makeChart("mapelChart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Total SKS",
          data: semesterData.map((d) => d.totalSKS),
          borderColor: C.amber,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: C.amber,
          pointBorderColor: D.pointBorder,
          pointBorderWidth: 2,
        },
        {
          label: "Jumlah MK",
          data: semesterData.map((d) => d.totalMK),
          borderColor: C.green,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: C.green,
          pointBorderColor: D.pointBorder,
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      ...sharedOpts,
      scales: {
        y: {
          min: 1,
          grid: { color: D.gridColor },
          ticks: { stepSize: 1 },
        },
      },
    },
  });

  makeChart("gradeChart", {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Nilai A",
          data: semesterData.map((d) => d.totalA),
          backgroundColor: C.green + "bb",
          borderRadius: 7,
          borderSkipped: false,
        },
        {
          label: "Nilai B",
          data: semesterData.map((d) => d.totalB),
          backgroundColor: C.amber + "bb",
          borderRadius: 7,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45 } },
        y: { beginAtZero: true, grid: { color: D.gridColor } },
      },
    },
  });

  makeChart("sksChart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Nilai A",
          data: semesterData.map((d) => d.totalA),
          borderColor: C.green,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: C.green,
          pointBorderColor: D.pointBorder,
          pointBorderWidth: 2,
        },
        {
          label: "Nilai B",
          data: semesterData.map((d) => d.totalB),
          borderColor: C.amber,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: C.amber,
          pointBorderColor: D.pointBorder,
          pointBorderWidth: 2,
        },
      ],
    },
    options: { ...sharedOpts },
  });

  /* ─ SEMESTER TABLES ─ */
  const containerEl = document.getElementById("container");
  semesters.forEach((semester) => {
    const sem = grouped[semester];
    const ip = sem.totalBobot / sem.totalSKS;
    const totalA = sem.data.filter((r) => r[5].trim() === "A").length;
    const totalB = sem.data.filter((r) => r[5].trim() === "B").length;

    const card = document.createElement("div");
    card.className = "semester-card";
    card.innerHTML = `
            <div class="semester-header">
              <div class="semester-title">
                <div class="sem-num">${semester}</div>
                Semester ${semester}
              </div>
              <div class="semester-badges">
                <span class="badge badge-blue"><i class="fa-solid fa-book fa-xs"></i> ${sem.data.length} MK</span>
                <span class="badge badge-green"><i class="fa-solid fa-star fa-xs"></i> A: ${totalA}</span>
                <span class="badge badge-amber"><i class="fa-solid fa-star-half-stroke fa-xs"></i> B: ${totalB}</span>
                <span class="badge badge-indigo"><i class="fa-solid fa-graduation-cap fa-xs"></i> ${ip.toFixed(2)}</span>
              </div>
              <i class="fa-solid fa-chevron-down toggle-icon"></i>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>No</th><th>Kode</th>
                    <th style="text-align:left">Mata Kuliah</th>
                    <th>Smt</th><th>SKS</th><th>Grade</th><th>Nilai</th><th>Bobot</th>
                  </tr>
                </thead>
                <tbody>
                  ${sem.data
                    .map(
                      (cols) => `
                    <tr>
                      <td>${cols[0]}</td>
                      <td style="font-family:'JetBrains Mono',monospace;font-size:0.77rem">${cols[1]}</td>
                      <td class="td-name">${cols[2]}</td>
                      <td>${cols[3]}</td>
                      <td>${cols[4]}</td>
                      <td><span class="grade-badge ${cols[5].trim() === "A" ? "grade-A" : cols[5].trim() === "B" ? "grade-B" : "grade-C"}">${cols[5]}</span></td>
                      <td>${cols[6]}</td>
                      <td style="font-family:'JetBrains Mono',monospace">${cols[7]}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                  <tr class="summary-row">
                    <td colspan="4">TOTAL</td>
                    <td>${sem.totalSKS.toFixed(0)}</td>
                    <td colspan="2"></td>
                    <td>${sem.totalBobot.toFixed(2)}</td>
                  </tr>
                  <tr class="ip-row">
                    <td colspan="8">IP Semester ${semester} : ${ip.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;

    card.querySelector(".semester-header").addEventListener("click", () => {
      const collapsed = card.classList.toggle("collapsed");
      card
        .querySelector(".table-container")
        .classList.toggle("hidden", collapsed);
    });

    containerEl.appendChild(card);
  });

  /* ─ FINAL SUMMARY ─ */
  document.getElementById("final").innerHTML = `
          <div class="final-box">
            <div class="final-box-header">
              <i class="fa-solid fa-clipboard-list" style="font-size:1.2rem;color:var(--accent-indigo)"></i>
              <h3>Ringkasan Akademik</h3>
            </div>
            <div class="final-grid">
              <div class="stat-card" style="padding:18px">
                <div class="stat-icon"><i class="fa-solid fa-layer-group"></i></div>
                <div class="stat-title">Total SKS</div>
                <div class="stat-value" style="font-size:1.9rem">${totalAllSKS.toFixed(0)}</div>
                <div class="stat-sub">${semesters.length} semester</div>
              </div>
              <div class="stat-card" style="padding:18px">
                <div class="stat-icon"><i class="fa-solid fa-star"></i></div>
                <div class="stat-title">IPK Final</div>
                <div class="stat-value" style="font-size:1.9rem">${ipk.toFixed(2)}</div>
                <div class="stat-sub">${ipk >= 3.5 ? "✦ Cum Laude" : ipk >= 3.0 ? "Sangat Memuaskan" : "Memuaskan"}</div>
              </div>
              <div class="stat-card" style="padding:18px">
                <div class="stat-icon"><i class="fa-solid fa-list-check"></i></div>
                <div class="stat-title">Total MK</div>
                <div class="stat-value" style="font-size:1.9rem">${totalMK}</div>
                <div class="stat-sub">mata kuliah</div>
              </div>
              <div class="stat-card" style="padding:18px">
                <div class="stat-icon"><i class="fa-solid fa-medal"></i></div>
                <div class="stat-title">Nilai A</div>
                <div class="stat-value" style="font-size:1.9rem">${totalGradeA}</div>
                <div class="stat-sub">${Math.round((totalGradeA / totalMK) * 100)}% dari total MK</div>
              </div>
            </div>
            <div class="final-pie-row">
              <div class="pie-box">
                <div class="pie-box-title"><i class="fa-solid fa-chart-pie fa-xs"></i> Distribusi Nilai A & B</div>
                <canvas id="pieChartA"></canvas>
              </div>
              <div class="info-box">
                <div>
                  <div class="info-row-title"><i class="fa-solid fa-circle fa-2xs" style="color:var(--accent-green)"></i> Nilai A</div>
                  <div class="info-row-val" style="color:var(--accent-green)">${totalGradeA}<span class="info-row-unit">mata kuliah</span></div>
                </div>
                <div class="divider"></div>
                <div>
                  <div class="info-row-title"><i class="fa-solid fa-circle fa-2xs" style="color:var(--accent-amber)"></i> Nilai B</div>
                  <div class="info-row-val" style="color:var(--accent-amber)">${totalGradeB}<span class="info-row-unit">mata kuliah</span></div>
                </div>
                <div class="divider"></div>
                <div>
                  <div class="info-row-title"><i class="fa-solid fa-percent fa-2xs" style="color:var(--accent-indigo)"></i> Persentase A</div>
                  <div class="info-row-val" style="color:var(--accent-indigo)">${Math.round((totalGradeA / totalMK) * 100)}<span class="info-row-unit">%</span></div>
                </div>
              </div>
            </div>
          </div>
        `;

  makeChart("pieChartA", {
    type: "doughnut",
    data: {
      labels: ["Nilai A", "Nilai B"],
      datasets: [
        {
          data: [totalGradeA, totalGradeB],
          backgroundColor: [C.green, C.amber],
          borderColor: D.pointBorder,
          borderWidth: 3,
          hoverBorderWidth: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 18,
            usePointStyle: true,
            pointStyle: "circle",
            color: D.color,
          },
        },
      },
    },
  });
}

//  INIT
const initialData = processData(document.getElementById("dataInput").value);
renderUI(initialData);

if (localStorage.getItem("input_data")) {
  renderUI(processData(localStorage.getItem("input_data")));
}

document.getElementById("updateBtn").addEventListener("click", () => {
  localStorage.setItem(
    "input_data",
    document.getElementById("dataInput").value,
  );
  renderUI(processData(document.getElementById("dataInput").value));
});
