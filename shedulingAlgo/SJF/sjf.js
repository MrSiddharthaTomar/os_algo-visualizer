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
playBtn.addEventListener('click', runSJF);
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

// Run SJF algorithm
function runSJF() {
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
            row: row
        };
    });
    
    // Sort by arrival time (initial)
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    let currentTime = 0;
    let totalTAT = 0;
    let totalWT = 0;
    let totalRT = 0;
    let ganttChartHTML = '';
    
    // Start scheduling
    while (processes.length > 0) {
        // Filter processes that have arrived
        const readyQueue = processes.filter(p => p.arrivalTime <= currentTime);
        
        if (readyQueue.length > 0) {
            // Select process with the shortest burst time
            const process = readyQueue.reduce((prev, curr) => (prev.burstTime < curr.burstTime ? prev : curr));
            
            // Update start time
            const startTime = Math.max(currentTime, process.arrivalTime);
            
            // Calculate completion time
            const completionTime = startTime + process.burstTime;
            
            // Calculate response time (first time CPU is allocated)
            const responseTime = startTime - process.arrivalTime;
            
            // Calculate turnaround time (completion - arrival)
            const turnaroundTime = completionTime - process.arrivalTime;
            
            // Calculate waiting time (turnaround - burst)
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
            
            // Update current time for next process
            currentTime = completionTime;
            
            // Remove the process from the list as it's completed
            processes.splice(processes.indexOf(process), 1);
            
            // Add to Gantt chart
            const width = (process.burstTime / currentTime) * 100;
            ganttChartHTML += `
                <div class="gantt-block" style="
                    width: ${width}%; 
                    background-color: hsl(${process.id * 36}, 70%, 65%);
                ">
                    <div class="process-name">${process.name}</div>
                    <div class="time-range">${startTime}-${completionTime}</div>
                </div>
            `;
        } else {
            // If no processes are ready, increment currentTime
            currentTime++;
        }
    }
    
    // Update average metrics
    avgTAT.textContent = (totalTAT / rows.length).toFixed(2);
    avgWT.textContent = (totalWT / rows.length).toFixed(2);
    avgRT.textContent = (totalRT / rows.length).toFixed(2);
    
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
