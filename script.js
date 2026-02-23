const data = `
1	MBB101201	BAHASA INGGRIS I (UMUM)	1	2.00	B	3,00	6,00
2	MBB201202	BAHASA INGGRIS II (CONVERSATION)	2	2.00	B	3,00	6,00
3	MBB301203	BAHASA INGGRIS III	3	2.00	B	3,00	6,00
4	MKB101203	SISTEM OPERASI	3	2.00	A	4,00	8,00
5	MKB101204	KOMPUTER TERAPAN I	1	2.00	B	3,00	6,00
6	MKB101207	BASIS DATA	1	2.00	B	3,00	6,00
7	MKB101210	ALGORITMA & DASAR PEMROGRAMAN	1	4.00	B	3,00	12,00
8	MKB201203	INSTALLASI TROUBLE SHOOTING	1	2.00	B	3,00	6,00
9	MKB201205	KOMPUTER TERAPAN II	2	2.00	A	4,00	8,00
10	MKB201209	PEMROGRAMAN DATABASE	2	4.00	A	4,00	16,00
11	MKB201210	BAHASA PEMROGRAMAN I	1	4.00	B	3,00	12,00
12	MKB301205	KOMUNIKASI DATA DAN JARINGAN	1	2.00	B	3,00	6,00
13	MKB301206	INTERNET DAN E-COMMERCE	3	2.00	A	4,00	8,00
14	MKB301211	BAHASA PEMROGRAMAN 2 (VB.NET)	2	4.00	B	3,00	12,00
15	MKB301219	PRAKTEK AKUNTANSI	3	2.00	A	4,00	8,00
16	MKB301221	TEKNIK ANIMASI DAN MULTIMEDIA	2	2.00	B	3,00	6,00
17	MKB301224	DESAIN GRAFIS	2	2.00	B	3,00	6,00
18	MKB401213	PEMROGRAMAN WEB I	3	4.00	A	4,00	16,00
19	MKB401214	PEMROGRAMAN ANIMASI	3	2.00	A	4,00	8,00
20	MKB401216	DESAIN WEB	2	4.00	B	3,00	12,00
21	MKK101206	PENGANTAR MANAJEMEN	3	2.00	A	4,00	8,00
22	MKK101208	PENGANTAR SISTEM INFORMASI	3	2.00	A	4,00	8,00
23	MKK201203	PENGANTAR AKUNTANSI	2	2.00	A	4,00	8,00
24	MKK201204	ANALISA PERANCANGAN SISTEM	1	2.00	B	3,00	6,00
`;

const rows = data.trim().split("\n");
const grouped = {};

let totalAllSKS = 0;
let totalAllBobot = 0;

// Kelompokkan dan hitung
rows.forEach((row) => {
  const cols = row.split("\t");
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

// Dashboard Cards
const ipk = totalAllBobot / totalAllSKS;
const totalMK = rows.length;
const totalGradeA = rows.filter(
  (row) => row.split("\t")[5].trim() === "A",
).length;
const totalGradeB = rows.filter(
  (row) => row.split("\t")[5].trim() === "B",
).length;

document.getElementById("dashboard").innerHTML = `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-title">Total Mahasiswa</div>
                    <div class="stat-value">1</div>
                    <div class="stat-trend">Aktif</div>
                </div>
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
                    <div class="stat-title">IPK</div>
                    <div class="stat-value">${ipk.toFixed(2)}</div>
                    <div class="stat-trend">${ipk >= 3.5 ? "Cum Laude" : ipk >= 3.0 ? "Sangat Memuaskan" : "Memuaskan"}</div>
                </div>
            </div>
        `;

// Grafik
const chartContainer = document.createElement("div");
chartContainer.className = "chart-container";
chartContainer.innerHTML = `
            <div class="chart-header">
                <h3>📈 Analisis Tren Akademik</h3>
                <div class="chart-legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: #4a90e2;"></div>
                        <span>IP Semester</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #f39c12;"></div>
                        <span>Total SKS</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #2ecc71;"></div>
                        <span>Jumlah MK</span>
                    </div>
                </div>
            </div>
            <canvas id="trendChart"></canvas>
        `;

const chartsRow = document.createElement("div");
chartsRow.className = "charts-row";
chartsRow.innerHTML = `
            <div class="chart-box">
                <h4>Distribusi Nilai per Semester</h4>
                <canvas id="gradeChart"></canvas>
            </div>
            <div class="chart-box">
                <h4>Beban SKS per Semester</h4>
                <canvas id="sksChart"></canvas>
            </div>
        `;

document.getElementById("charts").appendChild(chartContainer);
document.getElementById("charts").appendChild(chartsRow);

// Trend Chart
new Chart(document.getElementById("trendChart"), {
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
        yAxisID: "y",
      },
      {
        label: "Total SKS",
        data: semesterData.map((d) => d.totalSKS),
        borderColor: "#f39c12",
        backgroundColor: "rgba(243, 156, 18, 0.1)",
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
      {
        label: "Jumlah MK",
        data: semesterData.map((d) => d.totalMK),
        borderColor: "#2ecc71",
        backgroundColor: "rgba(46, 204, 113, 0.1)",
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
      },
    ],
  },
  options: {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "IP Semester",
        },
        min: 2.5,
        max: 4.0,
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Jumlah",
        },
        min: 0,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  },
});

// Grade Distribution Chart
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
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Jumlah Mata Kuliah",
        },
      },
    },
  },
});

// SKS Distribution Chart
new Chart(document.getElementById("sksChart"), {
  type: "line",
  data: {
    labels: semesterData.map((d) => `Semester ${d.semester}`),
    datasets: [
      {
        label: "Total SKS",
        data: semesterData.map((d) => d.totalSKS),
        borderColor: "#e74c3c",
        backgroundColor: "rgba(231, 76, 60, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Total SKS",
        },
      },
    },
  },
});

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
                    <span>📊 IP: ${ip.toFixed(2)}</span>
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

    const tdNo = document.createElement("td");
    tdNo.textContent = cols[0];
    tr.appendChild(tdNo);

    const tdKode = document.createElement("td");
    tdKode.textContent = cols[1];
    tr.appendChild(tdKode);

    const tdNama = document.createElement("td");
    tdNama.textContent = cols[2];
    tdNama.style.textAlign = "left";
    tr.appendChild(tdNama);

    const tdSmt = document.createElement("td");
    tdSmt.textContent = cols[3];
    tr.appendChild(tdSmt);

    const tdSKS = document.createElement("td");
    tdSKS.textContent = cols[4];
    tr.appendChild(tdSKS);

    const tdGrade = document.createElement("td");
    const gradeSpan = document.createElement("span");
    gradeSpan.className = `grade-badge ${cols[5].trim() === "A" ? "grade-A" : "grade-B"}`;
    gradeSpan.textContent = cols[5];
    tdGrade.appendChild(gradeSpan);
    tr.appendChild(tdGrade);

    const tdNilai = document.createElement("td");
    tdNilai.textContent = cols[6];
    tr.appendChild(tdNilai);

    const tdBobot = document.createElement("td");
    tdBobot.textContent = cols[7];
    tr.appendChild(tdBobot);

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
document.getElementById("final").innerHTML = `
            <div class="final-box">
                <h3>📊 Ringkasan Akademik</h3>
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-title">IP Tertinggi</div>
                        <div class="stat-value">${Math.max(...semesterData.map((d) => d.ip)).toFixed(2)}</div>
                        <div class="stat-trend">Semester ${semesterData.find((d) => d.ip === Math.max(...semesterData.map((d) => d.ip))).semester}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-title">IP Terendah</div>
                        <div class="stat-value">${Math.min(...semesterData.map((d) => d.ip)).toFixed(2)}</div>
                        <div class="stat-trend">Semester ${semesterData.find((d) => d.ip === Math.min(...semesterData.map((d) => d.ip))).semester}</div>
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
