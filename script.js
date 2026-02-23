function processData(inputData) {
  const rows = inputData
    .trim()
    .split("\n")
    .filter((row) => row.trim() !== "");
  const grouped = {};

  let totalAllSKS = 0;
  let totalAllBobot = 0;

  rows.forEach((row) => {
    const cols = row.split("\t");
    if (cols.length < 8) return; // skip invalid row

    const semester = cols[3];
    const sks = parseFloat(cols[4]);
    const bobot = parseFloat(cols[7].replace(",", "."));

    if (!grouped[semester]) {
      grouped[semester] = {
        data: [],
        totalSKS: 0,
        totalBobot: 0,
      };
    }

    grouped[semester].data.push(cols);
    grouped[semester].totalSKS += sks;
    grouped[semester].totalBobot += bobot;

    totalAllSKS += sks;
    totalAllBobot += bobot;
  });

  const semesters = Object.keys(grouped).sort((a, b) => a - b);

  // Kumpulkan data untuk analisis
  const semesterData = semesters.map((sem) => {
    const data = grouped[sem];
    const ip = data.totalBobot / data.totalSKS;
    const totalMK = data.data.length;
    const totalA = data.data.filter((row) => row[5].trim() === "A").length;
    const totalB = data.data.filter((row) => row[5].trim() === "B").length;

    return {
      semester: sem,
      ip: ip,
      totalSKS: data.totalSKS,
      totalBobot: data.totalBobot,
      totalMK: totalMK,
      totalA: totalA,
      totalB: totalB,
    };
  });

  const ipk = totalAllBobot / totalAllSKS;
  const totalMK = rows.length;
  const totalGradeA = rows.filter(
    (row) => row.split("\t")[5].trim() === "A",
  ).length;
  const totalGradeB = rows.filter(
    (row) => row.split("\t")[5].trim() === "B",
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
    rows,
  } = dataObj;

  // Bersihkan container
  document.getElementById("charts").innerHTML = "";
  document.getElementById("container").innerHTML = "";
  document.getElementById("final").innerHTML = "";

  // Grafik
  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";
  chartContainer.innerHTML = `
    <div class="chart-header">
      <h3>📈 Analisis Tren Akademik</h3>
    </div>
    <div class="charts-row">
      <div class="chart-box">
        <h4>IP per Semester</h4>
        <canvas id="ipkChart"></canvas>
      </div>
      <div class="chart-box">
        <h4>SKS & Jumlah MK per Semester</h4>
        <canvas id="mapelChart"></canvas>
      </div>
    </div>
  `;
  document.getElementById("charts").appendChild(chartContainer);

  // Distribusi Nilai + Tabel Lingkaran
  const chartsRow = document.createElement("div");
  chartsRow.className = "chart-container";
  chartsRow.innerHTML = `
    <div class="chart-header">
      <h3>Distribusi Nilai per Semester</h3>
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-color" style="background: #2ecc71;"></div>
          <span>Nilai A</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #f39c12;"></div>
          <span>Nilai B</span>
        </div>
      </div>
    </div>
    <div class="charts-row">
      <div class="chart-box">
        <h4>Bar Chart Nilai A & B</h4>
        <canvas id="gradeChart"></canvas>
      </div>
      <div class="chart-box">
        <h4>Line Chart Nilai A & B</h4>
        <canvas id="sksChart"></canvas>
      </div>
    </div>
    <div class="pie-charts-row">
      <div class="pie-chart-item">
        <h5>Total Nilai A</h5>
        <canvas id="pieChartA"></canvas>
      </div>
      <div class="pie-chart-item">
        <h5>Total Nilai B</h5>
        <canvas id="pieChartB"></canvas>
      </div>
    </div>
  `;
  document.getElementById("charts").appendChild(chartsRow);

  // Chart IPK
  new Chart(document.getElementById("ipkChart"), {
    type: "line",
    data: {
      labels: semesterData.map((d) => `Semester ${d.semester}`),
      datasets: [
        {
          label: "IP Semester",
          data: semesterData.map((d) => d.ip),
          borderColor: "#4a90e2",
          backgroundColor: "rgba(74, 144, 226, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: 4.0,
          title: { display: true, text: "IP Semester" },
        },
      },
    },
  });

  // Chart SKS & MK
  new Chart(document.getElementById("mapelChart"), {
    type: "line",
    data: {
      labels: semesterData.map((d) => `Semester ${d.semester}`),
      datasets: [
        {
          label: "Total SKS",
          data: semesterData.map((d) => d.totalSKS),
          borderColor: "#f39c12",
          backgroundColor: "rgba(243, 156, 18, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
        },
        {
          label: "Jumlah MK",
          data: semesterData.map((d) => d.totalMK),
          borderColor: "#2ecc71",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          tension: 0.4,
          fill: true,
          yAxisID: "y",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Jumlah" },
        },
      },
    },
  });

  // Grade Distribution Chart (Bar)
  new Chart(document.getElementById("gradeChart"), {
    type: "bar",
    data: {
      labels: semesterData.map((d) => `Semester ${d.semester}`),
      datasets: [
        {
          label: "Grade A",
          data: semesterData.map((d) => d.totalA),
          backgroundColor: "#2ecc71",
          borderRadius: 6,
        },
        {
          label: "Grade B",
          data: semesterData.map((d) => d.totalB),
          backgroundColor: "#f39c12",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "top" } },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Jumlah Mata Kuliah" },
        },
      },
    },
  });

  // Line Chart Nilai A & B
  new Chart(document.getElementById("sksChart"), {
    type: "line",
    data: {
      labels: semesterData.map((d) => `Semester ${d.semester}`),
      datasets: [
        {
          label: "Nilai A",
          data: semesterData.map((d) => d.totalA),
          borderColor: "#2ecc71",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Nilai B",
          data: semesterData.map((d) => d.totalB),
          borderColor: "#f39c12",
          backgroundColor: "rgba(243, 156, 18, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Jumlah" },
        },
      },
    },
  });

  // Pie Chart untuk Total Nilai A
  new Chart(document.getElementById("pieChartA"), {
    type: "pie",
    data: {
      labels: semesterData.map((d) => `Semester ${d.semester}`),
      datasets: [
        {
          data: semesterData.map((d) => d.totalA),
          backgroundColor: [
            "#2ecc71",
            "#27ae60",
            "#229954",
            "#1e8449",
            "#186a3b",
            "#145a32",
            "#0e4d2a",
            "#0a3a20",
            "#0b4d2b",
            "#0c5f37",
          ],
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 12 } },
      },
    },
  });

  // Pie Chart untuk Total Nilai B
  new Chart(document.getElementById("pieChartB"), {
    type: "pie",
    data: {
      labels: semesterData.map((d) => `Semester ${d.semester}`),
      datasets: [
        {
          data: semesterData.map((d) => d.totalB),
          backgroundColor: [
            "#f39c12",
            "#e67e22",
            "#d35400",
            "#ba6b0c",
            "#a04000",
            "#b45f06",
            "#9c5a0d",
            "#874d0c",
            "#6b3e0a",
            "#4f2e07",
          ],
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 12 } },
      },
    },
  });

  // Tabel per Semester
  const container = document.getElementById("container");
  semesters.forEach((semester) => {
    const sem = grouped[semester];
    const ip = sem.totalBobot / sem.totalSKS;

    const semesterCard = document.createElement("div");
    semesterCard.className = "semester-card";

    const semesterHeader = document.createElement("div");
    semesterHeader.className = "semester-header";

    const totalA = sem.data.filter((row) => row[5].trim() === "A").length;
    const totalB = sem.data.filter((row) => row[5].trim() === "B").length;

    semesterHeader.innerHTML = `
      Semester ${semester}
      <div class="semester-stats">
        <span>📚 ${sem.data.length} MK</span>
        <span>⭐ A: ${totalA}</span>
        <span>⭐ B: ${totalB}</span>
      </div>
    `;
    semesterCard.appendChild(semesterHeader);

    const tableContainer = document.createElement("div");
    tableContainer.className = "table-container";

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>No</th>
          <th>Kode</th>
          <th>Nama Mata Kuliah</th>
          <th>Smt</th>
          <th>SKS</th>
          <th>Grade</th>
          <th>Nilai Mutu</th>
          <th>Bobot</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    sem.data.forEach((cols, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${cols[0]}</td>
        <td>${cols[1]}</td>
        <td style="text-align:left">${cols[2]}</td>
        <td>${cols[3]}</td>
        <td>${cols[4]}</td>
        <td><span class="grade-badge ${cols[5].trim() === "A" ? "grade-A" : "grade-B"}">${cols[5]}</span></td>
        <td>${cols[6]}</td>
        <td>${cols[7]}</td>
      `;
      tbody.appendChild(tr);
    });

    const summaryRow = document.createElement("tr");
    summaryRow.className = "summary-row";
    summaryRow.innerHTML = `
      <td colspan="4"><strong>TOTAL</strong></td>
      <td><strong>${sem.totalSKS.toFixed(2)}</strong></td>
      <td colspan="2"></td>
      <td><strong>${sem.totalBobot.toFixed(2)}</strong></td>
    `;
    tbody.appendChild(summaryRow);

    const ipRow = document.createElement("tr");
    ipRow.className = "ip-row";
    ipRow.innerHTML = `
      <td colspan="8"><strong>IP Semester ${semester} : ${ip.toFixed(2)}</strong></td>
    `;
    tbody.appendChild(ipRow);

    tableContainer.appendChild(table);
    semesterCard.appendChild(tableContainer);
    container.appendChild(semesterCard);
  });

  // Final Box
  const ipTertinggi = Math.max(...semesterData.map((d) => d.ip));
  const ipTerendah = Math.min(...semesterData.map((d) => d.ip));
  const semTertinggi =
    semesterData.find((d) => d.ip === ipTertinggi)?.semester || "-";
  const semTerendah =
    semesterData.find((d) => d.ip === ipTerendah)?.semester || "-";

  document.getElementById("final").innerHTML = `
    <div class="final-box">
      <h3>📊 Ringkasan Akademik</h3>
      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-title">Total Mata Kuliah</div>
          <div class="stat-value">${totalMK}</div>
          <div class="stat-trend">${semesters.length} Semester</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total SKS</div>
          <div class="stat-value">${totalAllSKS.toFixed(0)}</div>
          <div class="stat-trend">Rata-rata ${(totalAllSKS / semesters.length).toFixed(1)} per semester</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total IPK</div>
          <div class="stat-value">${ipk.toFixed(2)}</div>
          <div class="stat-trend">${ipk >= 3.5 ? "Cum Laude" : ipk >= 3.0 ? "Sangat Memuaskan" : "Memuaskan"}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">IP Tertinggi</div>
          <div class="stat-value">${ipTertinggi.toFixed(2)}</div>
          <div class="stat-trend">Semester ${semTertinggi}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">IP Terendah</div>
          <div class="stat-value">${ipTerendah.toFixed(2)}</div>
          <div class="stat-trend">Semester ${semTerendah}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total Grade A</div>
          <div class="stat-value">${totalGradeA}</div>
          <div class="stat-trend">${((totalGradeA / totalMK) * 100).toFixed(1)}% dari total</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total Grade B</div>
          <div class="stat-value">${totalGradeB}</div>
          <div class="stat-trend">${((totalGradeB / totalMK) * 100).toFixed(1)}% dari total</div>
        </div>
      </div>
    </div>
  `;
}

// Inisialisasi pertama kali dengan data default
const defaultData = document.getElementById("dataInput").value;
const initialData = processData(defaultData);
renderUI(initialData);

// Event listener untuk tombol update
document.getElementById("updateBtn").addEventListener("click", function () {
  const inputData = document.getElementById("dataInput").value;
  const processed = processData(inputData);
  renderUI(processed);
});
