let processes = [];

document.getElementById("add-process").addEventListener("click", () => {
  const arrival = parseInt(document.getElementById("arrival-time").value);
  const burst = parseInt(document.getElementById("burst-time").value);
  const priority = parseInt(document.getElementById("priority").value);
  const error = document.getElementById("error-message");

  if (isNaN(arrival) || isNaN(burst) || isNaN(priority) || burst <= 0 || priority < 0) {
    error.style.display = "block";
    return;
  }

  error.style.display = "none";
  processes.push({
    id: `P${processes.length + 1}`,
    arrival,
    burst,
    priority
  });
  renderTable();
});

document.getElementById("play").addEventListener("click", runSimulation);
document.getElementById("reset").addEventListener("click", () => {
  processes = [];
  renderTable();
  document.getElementById("gantt-chart").innerHTML = "";
  document.getElementById("avg-tat").innerText = "0";
  document.getElementById("avg-wt").innerText = "0";
  document.getElementById("avg-rt").innerText = "0";
});

function renderTable() {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";
  processes.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>${p.priority}</td>
            <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
            <td><button class="btn-delete"><i class="fas fa-trash"></i></button></td>
        `;
    tbody.appendChild(tr);
    tr.querySelector(".btn-delete").addEventListener("click", () => {
      processes.splice(i, 1);
      renderTable();
    });
  });
}

function runSimulation() {
  let time = 0;
  let completed = 0;
  const n = processes.length;
  let gantt = [];

  processes.forEach(p => {
    p.remaining = p.burst;
    p.start = -1;
    p.completion = 0;
    p.response = 0;
    p.waiting = 0;
    p.turnaround = 0;
  });

  while (completed < n) {
    const ready = processes.filter(p => p.arrival <= time && p.remaining > 0);
    if (ready.length > 0) {
      ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
      const current = ready[0];

      current.start = time;
      current.response = time - current.arrival;
      time += current.burst;
      current.completion = time;
      current.turnaround = current.completion - current.arrival;
      current.waiting = current.turnaround - current.burst;
      current.remaining = 0;
      completed++;

      for (let i = 0; i < current.burst; i++) {
        gantt.push(current.id);
      }
    } else {
      gantt.push("Idle");
      time++;
    }
  }

  updateTable();
  drawGantt(gantt);
}

function updateTable() {
  const tbody = document.querySelector("tbody");
  let totalTat = 0, totalWt = 0, totalRt = 0;

  processes.forEach((p, i) => {
    const row = tbody.children[i].children;
    row[4].innerText = p.start;
    row[5].innerText = p.completion;
    row[6].innerText = p.response;
    row[7].innerText = p.turnaround;
    row[8].innerText = p.waiting;

    totalTat += p.turnaround;
    totalWt += p.waiting;
    totalRt += p.response;
  });

  const n = processes.length;
  document.getElementById("avg-tat").innerText = (totalTat / n).toFixed(2);
  document.getElementById("avg-wt").innerText = (totalWt / n).toFixed(2);
  document.getElementById("avg-rt").innerText = (totalRt / n).toFixed(2);
}

function drawGantt(chart) {
  const gantt = document.getElementById("gantt-chart");
  gantt.innerHTML = "";
  chart.forEach(pid => {
    const div = document.createElement("div");
    div.textContent = pid;
    div.style.padding = "0.5rem";
    div.style.margin = "0 2px";
    div.style.background = pid === "Idle" ? "#ccc" : "var(--primary)";
    div.style.color = "white";
    div.style.borderRadius = "4px";
    div.style.minWidth = "40px";
    div.style.textAlign = "center";
    gantt.appendChild(div);
  });
}
