Chart.defaults.color = "#8b98b8";
Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
Chart.defaults.font.family = "'JetBrains Mono', monospace";
Chart.defaults.font.size = 11;

const COLORS = {
  blue: "#4f8ef7",
  green: "#34d399",
  amber: "#fbbf24",
  rose: "#f472b6",
  purple: "#a78bfa",
  cyan: "#22d3ee",
};

function processData(inputData) {
  const rows = inputData
    .trim()
    .split("\n")
    .filter((row) => row.trim() !== "" && /^\d/.test(row.trim()));
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
    rows,
  };
}

// Keep track of chart instances to destroy them on re-render
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

function renderUI(dataObj) {
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

  // ── STAT CARDS ──
  const ipMax = Math.max(...semesterData.map((d) => d.ip));
  const ipMin = Math.min(...semesterData.map((d) => d.ip));
  const semMax = semesterData.find((d) => d.ip === ipMax)?.semester || "-";
  const semMin = semesterData.find((d) => d.ip === ipMin)?.semester || "-";

  document.getElementById("stat-cards").innerHTML = `
        <div class="stat-grid">
          <div class="stat-card fadeup">
            <span class="stat-icon">📚</span>
            <div class="stat-title">Total SKS</div>
            <div class="stat-value">${totalAllSKS.toFixed(0)}</div>
            <div class="stat-sub">~${(totalAllSKS / semesters.length).toFixed(1)} SKS/semester</div>
          </div>
          <div class="stat-card fadeup">
            <span class="stat-icon">🎯</span>
            <div class="stat-title">IPK</div>
            <div class="stat-value">${ipk.toFixed(2)}</div>
            <div class="stat-sub">${ipk >= 3.5 ? "✦ Cum Laude" : ipk >= 3.0 ? "Sangat Memuaskan" : "Memuaskan"}</div>
          </div>
          <div class="stat-card fadeup">
            <span class="stat-icon">🏆</span>
            <div class="stat-title">IP Tertinggi</div>
            <div class="stat-value">${ipMax.toFixed(2)}</div>
            <div class="stat-sub">Semester ${semMax}</div>
          </div>
          <div class="stat-card fadeup">
            <span class="stat-icon">📉</span>
            <div class="stat-title">IP Terendah</div>
            <div class="stat-value">${ipMin.toFixed(2)}</div>
            <div class="stat-sub">Semester ${semMin}</div>
          </div>
        </div>
      `;

  const labels = semesterData.map((d) => `Sem ${d.semester}`);

  // ── CHARTS SECTION ──
  const chartsEl = document.getElementById("charts");

  chartsEl.innerHTML = `
        <!-- Chart Row 1: IPS & IPK trend -->
        <div class="chart-section" style="margin-bottom:16px">
          <div class="chart-section-header">
            <div class="chart-section-title">📈 Tren IPS & IPK</div>
            <div class="chart-legend">
              <div class="legend-item"><div class="legend-dot" style="background:${COLORS.blue}"></div>IPS</div>
              <div class="legend-item"><div class="legend-dot" style="background:${COLORS.rose}"></div>IPK</div>
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

        <!-- Chart Row 2: Grade distribution -->
        <div class="chart-section" style="margin-bottom:24px">
          <div class="chart-section-header">
            <div class="chart-section-title">📊 Distribusi Nilai</div>
            <div class="chart-legend">
              <div class="legend-item"><div class="legend-dot" style="background:${COLORS.green}"></div>Nilai A</div>
              <div class="legend-item"><div class="legend-dot" style="background:${COLORS.amber}"></div>Nilai B</div>
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

  // IPS & IPK Line Chart
  let cumBobot = 0,
    cumSKS = 0;
  const ipkLine = semesterData.map((d) => {
    cumBobot += d.totalBobot;
    cumSKS += d.totalSKS;
    return parseFloat((cumBobot / cumSKS).toFixed(3));
  });

  const sharedLineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { maxRotation: 45 },
      },
      y: {
        beginAtZero: false,
        grid: { color: "rgba(255,255,255,0.04)" },
      },
    },
  };

  makeChart("ipkChart", {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "IPS",
          data: semesterData.map((d) => parseFloat(d.ip.toFixed(3))),
          borderColor: COLORS.blue,
          backgroundColor: "rgba(79,142,247,0.08)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: COLORS.blue,
          pointBorderColor: "#0a0f1e",
          pointBorderWidth: 2,
        },
        {
          label: "IPK",
          data: ipkLine,
          borderColor: COLORS.rose,
          backgroundColor: "rgba(244,114,182,0.05)",
          tension: 0.4,
          fill: false,
          borderDash: [5, 4],
          pointRadius: 4,
          pointBackgroundColor: COLORS.rose,
          pointBorderColor: "#0a0f1e",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      ...sharedLineOpts,
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { maxRotation: 45 },
        },
        y: {
          min: 0,
          max: 4.0,
          grid: { color: "rgba(255,255,255,0.04)" },
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
          borderColor: COLORS.amber,
          backgroundColor: "rgba(251,191,36,0.08)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: COLORS.amber,
          pointBorderColor: "#0a0f1e",
          pointBorderWidth: 2,
        },
        {
          label: "Jumlah MK",
          data: semesterData.map((d) => d.totalMK),
          borderColor: COLORS.green,
          backgroundColor: "rgba(52,211,153,0.08)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: COLORS.green,
          pointBorderColor: "#0a0f1e",
          pointBorderWidth: 2,
        },
      ],
    },
    options: { ...sharedLineOpts },
  });

  makeChart("gradeChart", {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Nilai A",
          data: semesterData.map((d) => d.totalA),
          backgroundColor: "rgba(52,211,153,0.75)",
          borderRadius: 6,
        },
        {
          label: "Nilai B",
          data: semesterData.map((d) => d.totalB),
          backgroundColor: "rgba(251,191,36,0.75)",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45 } },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255,255,255,0.04)" },
        },
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
          borderColor: COLORS.green,
          backgroundColor: "rgba(52,211,153,0.08)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: COLORS.green,
          pointBorderColor: "#0a0f1e",
          pointBorderWidth: 2,
        },
        {
          label: "Nilai B",
          data: semesterData.map((d) => d.totalB),
          borderColor: COLORS.amber,
          backgroundColor: "rgba(251,191,36,0.08)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: COLORS.amber,
          pointBorderColor: "#0a0f1e",
          pointBorderWidth: 2,
        },
      ],
    },
    options: { ...sharedLineOpts },
  });

  // ── SEMESTER TABLES ──
  const container = document.getElementById("container");
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
              <span class="badge badge-blue">📚 ${sem.data.length} MK</span>
              <span class="badge badge-green">A: ${totalA}</span>
              <span class="badge badge-amber">B: ${totalB}</span>
              <span class="badge badge-blue">IP: ${ip.toFixed(2)}</span>
            </div>
            <span class="toggle-icon">▾</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>No</th><th>Kode</th><th style="text-align:left">Mata Kuliah</th>
                  <th>Smt</th><th>SKS</th><th>Grade</th><th>Nilai</th><th>Bobot</th>
                </tr>
              </thead>
              <tbody>
                ${sem.data
                  .map(
                    (cols) => `
                  <tr>
                    <td>${cols[0]}</td>
                    <td style="font-family:var(--font-mono);font-size:0.78rem">${cols[1]}</td>
                    <td class="td-name">${cols[2]}</td>
                    <td>${cols[3]}</td>
                    <td>${cols[4]}</td>
                    <td><span class="grade-badge ${cols[5].trim() === "A" ? "grade-A" : cols[5].trim() === "B" ? "grade-B" : "grade-C"}">${cols[5]}</span></td>
                    <td>${cols[6]}</td>
                    <td style="font-family:var(--font-mono)">${cols[7]}</td>
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

    // Toggle collapse
    const header = card.querySelector(".semester-header");
    const tableContainer = card.querySelector(".table-container");
    header.addEventListener("click", () => {
      const isCollapsed = card.classList.toggle("collapsed");
      tableContainer.classList.toggle("hidden", isCollapsed);
    });

    container.appendChild(card);
  });

  // ── FINAL SUMMARY ──
  document.getElementById("final").innerHTML = `
        <div class="final-box">
          <div class="final-box-header">
            <span style="font-size:1.3rem">📋</span>
            <h3>Ringkasan Akademik</h3>
          </div>
          <div class="final-grid">
            <div class="stat-card" style="padding:16px">
              <div class="stat-title">Total SKS</div>
              <div class="stat-value" style="font-size:1.8rem">${totalAllSKS.toFixed(0)}</div>
              <div class="stat-sub">${semesters.length} semester</div>
            </div>
            <div class="stat-card" style="padding:16px">
              <div class="stat-title">IPK Final</div>
              <div class="stat-value" style="font-size:1.8rem">${ipk.toFixed(2)}</div>
              <div class="stat-sub">${ipk >= 3.5 ? "✦ Cum Laude" : ipk >= 3.0 ? "Sangat Memuaskan" : "Memuaskan"}</div>
            </div>
            <div class="stat-card" style="padding:16px">
              <div class="stat-title">Total MK</div>
              <div class="stat-value" style="font-size:1.8rem">${totalMK}</div>
              <div class="stat-sub">Mata kuliah</div>
            </div>
            <div class="stat-card" style="padding:16px">
              <div class="stat-title">Nilai A</div>
              <div class="stat-value" style="font-size:1.8rem">${totalGradeA}</div>
              <div class="stat-sub">${Math.round((totalGradeA / totalMK) * 100)}% dari total MK</div>
            </div>
          </div>
          <div class="final-pie-row">
            <div class="pie-box">
              <div class="pie-box-title">Distribusi Nilai A & B</div>
              <canvas id="pieChartA"></canvas>
            </div>
            <div class="stat-card" style="padding:16px; justify-content:center; display:flex; flex-direction:column; gap:12px">
              <div>
                <div class="stat-title">Nilai A</div>
                <div style="font-size:1.5rem;font-weight:700;color:var(--accent-green);font-family:var(--font-mono)">${totalGradeA} <span style="font-size:0.9rem;color:var(--text-muted)">mata kuliah</span></div>
              </div>
              <div class="divider"></div>
              <div>
                <div class="stat-title">Nilai B</div>
                <div style="font-size:1.5rem;font-weight:700;color:var(--accent-amber);font-family:var(--font-mono)">${totalGradeB} <span style="font-size:0.9rem;color:var(--text-muted)">mata kuliah</span></div>
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
          backgroundColor: [COLORS.green, COLORS.amber],
          borderColor: "#111827",
          borderWidth: 3,
          hoverBorderWidth: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
      },
    },
  });
}

// Init
const processed = processData(document.getElementById("dataInput").value);
renderUI(processed);

document.getElementById("updateBtn").addEventListener("click", () => {
  const processed = processData(document.getElementById("dataInput").value);
  renderUI(processed);
});
