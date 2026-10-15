// Results page: one doughnut (party split) and one bar chart
// (Congress, BJP and each independent candidate) per post.
(() => {
  const stats = JSON.parse(document.getElementById("survey-stats").textContent);
  const INDEPENDENT_SHADES = ["#2E7D32", "#43A047", "#66BB6A", "#1B5E20", "#81C784", "#388E3C"];

  Chart.defaults.font.family = "'Noto Sans Devanagari', 'Noto Sans', sans-serif";
  Chart.defaults.color = "#45464d";

  const pctLabel = (count, total) => `${count} (${total ? ((count * 100) / total).toFixed(2) : "0.00"}%)`;

  for (const post of stats.posts) {
    const doughnut = document.getElementById(`doughnut-${post.id}`);
    const empty = post.total === 0;
    new Chart(doughnut, {
      type: "doughnut",
      data: {
        labels: post.parties.map((p) => p.label),
        datasets: [{
          // an empty post still draws a grey ring instead of nothing
          data: empty ? post.parties.map(() => 1) : post.parties.map((p) => p.count),
          backgroundColor: empty ? post.parties.map(() => "#E2E8F0") : post.parties.map((p) => p.color),
          borderColor: "#fff",
          borderWidth: 2,
        }],
      },
      options: {
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            enabled: !empty,
            callbacks: { label: (ctx) => `${ctx.label}: ${pctLabel(ctx.raw, post.total)}` },
          },
        },
      },
    });

    const independent = post.parties.find((p) => p.independent);
    const rows = [
      ...post.parties.filter((p) => p !== independent).map((p) => ({ label: p.label, count: p.count, color: p.color })),
      ...post.candidates.map((c, i) => ({
        label: `${c.name} (निर्दलीय)`,
        count: c.count,
        color: INDEPENDENT_SHADES[i % INDEPENDENT_SHADES.length],
      })),
    ];
    new Chart(document.getElementById(`bar-${post.id}`), {
      type: "bar",
      data: {
        labels: rows.map((r) => r.label),
        datasets: [{ data: rows.map((r) => r.count), backgroundColor: rows.map((r) => r.color), borderRadius: 4, maxBarThickness: 28 }],
      },
      options: {
        indexAxis: "y",
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#E2E8F0" }, title: { display: true, text: "प्रतिक्रियाएँ" } },
          y: { grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => pctLabel(ctx.raw, post.total) } },
        },
      },
    });
  }
})();
