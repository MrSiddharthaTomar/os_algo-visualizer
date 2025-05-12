// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const menu = document.querySelector('.menu');
const addProcessBtn = document.getElementById('add-process');
const processTable = document.querySelector('table');
const playBtn = document.getElementById('play');
const resetBtn = document.getElementById('reset');
const arrivalTimeInput = document.getElementById('arrival-time');
const burstTimeInput = document.getElementById('burst-time');
const errorMessage = document.getElementById('error-message');
const avgTAT = document.getElementById('avg-tat');
const avgWT = document.getElementById('avg-wt');
const avgRT = document.getElementById('avg-rt');
const ganttChart = document.getElementById('gantt-chart');

// Event Listeners
menuToggle.addEventListener('click', toggleMenu);
addProcessBtn.addEventListener('click', addProcess);
processTable.addEventListener('click', handleTableClick);
playBtn.addEventListener('click', runRR);
resetBtn.addEventListener('click', resetSimulation);

function toggleMenu() {
    menu.classList.toggle('open');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && menu.classList.contains('open')) {
        menu.classList.remove('open');
    }
});

function addProcess() {
    const arrivalTime = parseInt(arrivalTimeInput.value);
    const burstTime = parseInt(burstTimeInput.value);

    if (isNaN(arrivalTime) || isNaN(burstTime) || arrivalTime < 0 || burstTime <= 0) {
        errorMessage.style.display = 'block';
        return;
    }

    errorMessage.style.display = 'none';

    const tbody = processTable.querySelector('tbody');
    const processCount = tbody.children.length + 1;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>P${processCount}</td>
        <td>${arrivalTime}</td>
        <td>${burstTime}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td><button class="btn-delete"><i class="fas fa-trash"></i></button></td>
    `;

    tbody.appendChild(newRow);
    arrivalTimeInput.value = '';
    burstTimeInput.value = '';
}

function handleTableClick(e) {
    if (e.target.closest('.btn-delete')) {
        e.target.closest('tr').remove();
    }
}

function runRR() {
    const timeQuantumInput = document.getElementById('time-quantum');
    let timeQuantum = parseInt(timeQuantumInput.value);


    if (isNaN(timeQuantum) || timeQuantum <= 0) {
        alert("Please enter a valid Time Quantum");
        return;
    }

    const rows = Array.from(processTable.querySelectorAll('tbody tr'));
    if (rows.length === 0) {
        alert('Please add at least one process');
        return;
    }

    const processes = rows.map((row, index) => {
        const cells = row.querySelectorAll('td');
        return {
            id: index,
            name: cells[0].textContent,
            arrivalTime: parseInt(cells[1].textContent),
            burstTime: parseInt(cells[2].textContent),
            remainingTime: parseInt(cells[2].textContent),
            startTime: -1,
            completionTime: 0,
            responseTime: null,
            row: row
        };
    });

    let currentTime = 0;
    let queue = [];
    let ganttChartHTML = '';
    let totalTAT = 0, totalWT = 0, totalRT = 0;
    const readyQueue = [...processes];

    while (readyQueue.length > 0 || queue.length > 0) {
        for (let i = 0; i < readyQueue.length; ) {
            if (readyQueue[i].arrivalTime <= currentTime) {
                queue.push(readyQueue.splice(i, 1)[0]);
            } else {
                i++;
            }
        }

        if (queue.length === 0) {
            currentTime++;
            continue;
        }

        const current = queue.shift();

        if (current.startTime === -1) {
            current.startTime = currentTime;
            current.responseTime = currentTime - current.arrivalTime;
        }

        const execTime = Math.min(timeQuantum, current.remainingTime);
        const execStart = currentTime;
        const execEnd = currentTime + execTime;
        currentTime = execEnd;
        current.remainingTime -= execTime;

        ganttChartHTML += `
            <div class="gantt-block" style="width:${execTime * 10}px;background-color:hsl(${current.id * 36}, 70%, 65%)">
                <div class="process-name">${current.name}</div>
                <div class="time-range">${execStart}-${execEnd}</div>
            </div>
        `;

        for (let i = 0; i < readyQueue.length; ) {
            if (readyQueue[i].arrivalTime <= currentTime) {
                queue.push(readyQueue.splice(i, 1)[0]);
            } else {
                i++;
            }
        }

        if (current.remainingTime > 0) {
            queue.push(current);
        } else {
            current.completionTime = currentTime;
            const turnaround = current.completionTime - current.arrivalTime;
            const waiting = turnaround - current.burstTime;

            const cells = current.row.querySelectorAll('td');
            cells[3].textContent = current.startTime;
            cells[4].textContent = current.completionTime;
            cells[5].textContent = current.responseTime;
            cells[6].textContent = turnaround;
            cells[7].textContent = waiting;

            totalTAT += turnaround;
            totalWT += waiting;
            totalRT += current.responseTime;
        }
    }

    avgTAT.textContent = (totalTAT / processes.length).toFixed(2);
    avgWT.textContent = (totalWT / processes.length).toFixed(2);
    avgRT.textContent = (totalRT / processes.length).toFixed(2);

    ganttChart.innerHTML = `
        <style>
            .gantt-container {
                display: flex;
                height: 60px;
                width: 100%;
                margin-top: 10px;
            }
            .gantt-block {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                text-shadow: 0 0 2px rgba(0,0,0,0.5);
                overflow: hidden;
                position: relative;
                min-width: 40px;
            }
            .process-name {
                font-weight: bold;
                font-size: 0.9rem;
            }
            .time-range {
                font-size: 0.8rem;
            }
        </style>
        <div class="gantt-container">
            ${ganttChartHTML}
        </div>
    `;

    playBtn.disabled = true;
    playBtn.classList.add('secondary');
    playBtn.classList.remove('primary');
}

function resetSimulation() {
    location.reload();
}
