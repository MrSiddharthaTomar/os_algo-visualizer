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
playBtn.addEventListener('click', runSRJF);
resetBtn.addEventListener('click', resetSimulation);

// Toggle menu
function toggleMenu() {
    menu.classList.toggle('open');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && menu.classList.contains('open')) {
        menu.classList.remove('open');
    }
});

// Add new process to the table
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
    
    // Clear input fields
    arrivalTimeInput.value = '';
    burstTimeInput.value = '';
}

// Handle clicks on table (for delete buttons)
function handleTableClick(e) {
    if (e.target.closest('.btn-delete')) {
        e.target.closest('tr').remove();
    }
}

// Run SRJF algorithm
function runSRJF() {
    const rows = Array.from(processTable.querySelectorAll('tbody tr'));
    
    if (rows.length === 0) {
        alert('Please add at least one process');
        return;
    }
    
    // Extract process data
    const processes = rows.map((row, index) => {
        const cells = row.querySelectorAll('td');
        return {
            id: index,
            name: cells[0].textContent,
            arrivalTime: parseInt(cells[1].textContent),
            burstTime: parseInt(cells[2].textContent),
            remainingTime: parseInt(cells[2].textContent),
            row: row
        };
    });
    
    let currentTime = 0;
    let totalTAT = 0;
    let totalWT = 0;
    let totalRT = 0;
    let ganttChartHTML = '';
    let completed = 0;
    
    // Process until all processes are completed
    while (completed < processes.length) {
        // Filter processes that have arrived and are not completed
        const availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);
        
        if (availableProcesses.length === 0) {
            currentTime++;
            continue;
        }
        
        // Sort available processes by remaining burst time (Shortest Remaining Job First)
        availableProcesses.sort((a, b) => a.remainingTime - b.remainingTime);
        
        const process = availableProcesses[0];  // Choose the shortest remaining time process
        
        // Update start time and response time
        const startTime = currentTime;
        const responseTime = (process.remainingTime === process.burstTime) ? startTime - process.arrivalTime : process.row.querySelector('td').textContent;
        
        // Update remaining time
        process.remainingTime--;
        
        // If remaining time becomes 0, it's complete
        if (process.remainingTime === 0) {
            const completionTime = startTime + 1;  // 1 unit of time has passed
            const turnaroundTime = completionTime - process.arrivalTime;
            const waitingTime = turnaroundTime - process.burstTime;
            
            // Update table row with calculated values
            const cells = process.row.querySelectorAll('td');
            cells[3].textContent = startTime;
            cells[4].textContent = completionTime;
            cells[5].textContent = responseTime;
            cells[6].textContent = turnaroundTime;
            cells[7].textContent = waitingTime;
            
            // Update totals
            totalTAT += turnaroundTime;
            totalWT += waitingTime;
            totalRT += responseTime;
            
            completed++;
        }
        
        // Update current time for next process
        currentTime++;
        
        // Add to Gantt chart (with a small width for each unit of time)
        ganttChartHTML += `
            <div class="gantt-block" style="
                width: 10%; 
                background-color: hsl(${process.id * 36}, 70%, 65%);
            ">
                <div class="process-name">${process.name}</div>
                <div class="time-range">${startTime}-${startTime + 1}</div>
            </div>
        `;
    }
    
    // Update average metrics after all processes are complete
    avgTAT.textContent = (totalTAT / processes.length).toFixed(2);
    avgWT.textContent = (totalWT / processes.length).toFixed(2);
    avgRT.textContent = (totalRT / processes.length).toFixed(2);
    
    // Display Gantt chart
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
    
    // Disable play button after running
    playBtn.disabled = true;
    playBtn.classList.add('secondary');
    playBtn.classList.remove('primary');
}

// Reset simulation
function resetSimulation() {
    location.reload();
}
