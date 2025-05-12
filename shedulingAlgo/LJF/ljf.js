document.getElementById('add-process').addEventListener('click', () => {
  const arrivalInput = document.getElementById('arrival-time');
  const burstInput = document.getElementById('burst-time');
  const error = document.getElementById('error-message');

  const arrival = parseInt(arrivalInput.value);
  const burst = parseInt(burstInput.value);

  if (isNaN(arrival) || isNaN(burst) || arrival < 0 || burst <= 0) {
    error.style.display = 'block';
    return;
  }

  error.style.display = 'none';

  processes.push({
    pid: `P${processes.length + 1}`,
    arrival,
    burst
  });

  arrivalInput.value = '';
  burstInput.value = '';

  renderTable();
});

document.getElementById('play').addEventListener('click', () => {
  simulateLJF();
});

document.getElementById('reset').addEventListener('click', () => {
  processes = [];
  document.querySelector('tbody').innerHTML = '';
  document.getElementById('gantt-chart').innerHTML = '';
  document.getElementById('avg-tat').textContent = '0';
  document.getElementById('avg-wt').textContent = '0';
  document.getElementById('avg-rt').textContent = '0';
});

let processes = [];

function renderTable() {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  processes.forEach((p, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
          <td>${p.pid}</td>
          <td>${p.arrival}</td>
          <td>${p.burst}</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td><button class="btn-delete" onclick="deleteProcess(${index})"><i class="fas fa-trash"></i></button></td>
      `;
    tbody.appendChild(row);
  });
}

function deleteProcess(index) {
  processes.splice(index, 1);
  renderTable();
}

function simulateLJF() {
  let time = 0;
  let completed = 0;
  const n = processes.length;
  const gantt = [];

  let startTimes = {};
  let finishTimes = {};
  let responseTimes = {};
  let turnaroundTimes = {};
  let waitingTimes = {};

  const procCopy = JSON.parse(JSON.stringify(processes));
  procCopy.sort((a, b) => a.arrival - b.arrival);

  while (completed < n) {
    let idx = -1;
    let maxBurst = -1;

    for (let i = 0; i < n; i++) {
      const p = procCopy[i];
      if (p.arrival <= time && p.burst !== -1) {
        if (p.burst > maxBurst) {
          maxBurst = p.burst;
          idx = i;
        }
      }
    }

    if (idx === -1) {
      time++;
      continue;
    }

    const running = procCopy[idx];
    startTimes[running.pid] = time;
    time += running.burst;
    finishTimes[running.pid] = time;
    responseTimes[running.pid] = startTimes[running.pid] - running.arrival;
    turnaroundTimes[running.pid] = finishTimes[running.pid] - running.arrival;
    waitingTimes[running.pid] = turnaroundTimes[running.pid] - running.burst;

    gantt.push(running.pid);
    running.burst = -1;
    completed++;
  }

  renderResults(startTimes, finishTimes, responseTimes, turnaroundTimes, waitingTimes, gantt);
}

function renderResults(start, end, rt, tat, wt, gantt) {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';

  let totalRT = 0, totalTAT = 0, totalWT = 0;

  processes.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
          <td>${p.pid}</td>
          <td>${p.arrival}</td>
          <td>${p.burst}</td>
          <td>${start[p.pid]}</td>
          <td>${end[p.pid]}</td>
          <td>${rt[p.pid]}</td>
          <td>${tat[p.pid]}</td>
          <td>${wt[p.pid]}</td>
          <td></td>
      `;
    tbody.appendChild(row);

    totalRT += rt[p.pid];
    totalTAT += tat[p.pid];
    totalWT += wt[p.pid];
  });

  document.getElementById('avg-rt').textContent = (totalRT / processes.length).toFixed(2);
  document.getElementById('avg-tat').textContent = (totalTAT / processes.length).toFixed(2);
  document.getElementById('avg-wt').textContent = (totalWT / processes.length).toFixed(2);

  const chart = document.getElementById('gantt-chart');
  chart.innerHTML = '';
  gantt.forEach(pid => {
    const box = document.createElement('div');
    box.textContent = pid;
    box.style.padding = '0.5rem 1rem';
    box.style.margin = '0.2rem';
    box.style.background = 'var(--primary)';
    box.style.color = 'white';
    box.style.borderRadius = 'var(--border-radius)';
    chart.appendChild(box);
  });
}
