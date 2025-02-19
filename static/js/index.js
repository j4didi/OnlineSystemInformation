$(document).ready(function() {
    $('#processTable').DataTable({
        "order": [[2, "desc"]],
        "language": {
            "lengthMenu": "_MENU_"
        },
        "dom": '<"row justify-content-center align-items-center"<"col-auto"f><"col-auto"l>>tip'
    });
});

const cpuCtx = document.getElementById('cpuChart').getContext('2d');
const memoryCtx = document.getElementById('memoryChart').getContext('2d');
const diskCtx = document.getElementById('diskChart').getContext('2d');
const networkCtx = document.getElementById('networkChart').getContext('2d');

const cpuChart = new Chart(cpuCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'CPU Usage (%)',
            data: [],
            borderColor: 'rgba(255, 99, 132, 1)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
        }]
    },
    options: {
        maintainAspectRatio: false,
        responsive: true
    }
});

const memoryChart = new Chart(memoryCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Memory Usage (%)',
            data: [],
            borderColor: 'rgba(54, 162, 235, 1)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
        }]
    },
    options: {
        maintainAspectRatio: false,
        responsive: true
    }
});

const diskChart = new Chart(diskCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Disk Read (MBps)',
            data: [],
            borderColor: 'rgba(255, 159, 64, 1)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
        }, {
            label: 'Disk Write (MBps)',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
        }]
    },
    options: {
        maintainAspectRatio: false,
        responsive: true
    }
});

const networkChart = new Chart(networkCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Network Download (MBps)',
            data: [],
            borderColor: 'rgba(153, 102, 255, 1)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
        }, {
            label: 'Network Upload (MBps)',
            data: [],
            borderColor: 'rgba(255, 159, 64, 1)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
        }]
    },
    options: {
        maintainAspectRatio: false,
        responsive: true
    }
});

function fetchSystemInfo() {
    fetch('/api/system_info')
        .then(response => response.json())
        .then(data => {
            document.getElementById('cpu_percent').textContent = data.cpu_percent + "%";
            document.getElementById('memory_percent').textContent = parseFloat(data.memory_percent).toFixed(2) + "%";
            document.getElementById('disk_percent').textContent = `⬇ ${data.disk_read} ⬆ ${data.disk_write}`;
            document.getElementById('network_usage').textContent = `⬇ ${data.network_download} ⬆ ${data.network_upload}`;

            updateChart(cpuChart, data.cpu_percent);
            updateChart(memoryChart, data.memory_percent);
            updateChart(diskChart, data.disk_read, data.disk_write);
            updateChart(networkChart, data.network_download, data.network_upload);
        })
        .catch(error => console.error('Error fetching system info:', error));
}

function updateChart(chart, ...newData) {
    chart.data.labels.push('');
    if (chart.data.labels.length > 60) {
        chart.data.labels.shift();
    }
    chart.data.datasets.forEach((dataset, index) => {
        dataset.data.push(newData[index]);
        if (dataset.data.length > 60) {
            dataset.data.shift();
        }
    });
    chart.update();
}

function fetchProcesses() {
    fetch('/api/processes')
        .then(response => response.json())
        .then(data => {
            data.sort((a, b) =>
                (b.cpu_percent - a.cpu_percent) ||
                (b.memory_percent - a.memory_percent) ||
                ((b.disk_read + b.disk_write) - (a.disk_read + a.disk_write)) ||
                ((b.network_download + b.network_upload) - (a.network_download + a.network_upload))
            );

            let table = $('#processTable').DataTable();
            table.clear();

            data.forEach(proc => {
                table.row.add([
                    proc.pid,
                    `<a href="/process/${proc.pid}" class="text-light">${proc.name}</a>`,
                    proc.cpu_percent + "%",
                    parseFloat(proc.memory_percent).toFixed(2) + "%",
                    `⬇ ${proc.disk_read} ⬆ ${proc.disk_write}`,
                    `⬇ ${proc.network_download} ⬆ ${proc.network_upload}`,
                    `<button class="btn btn-danger btn-sm" onclick="endTask(${proc.pid})">End Task</button>`
                ]);
            });

            table.draw(false);
        })
        .catch(error => console.error('Error fetching processes:', error));
}

function endTask(pid) {
    fetch(`/api/end_task/${pid}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchProcesses();
        })
        .catch(error => console.error('Error ending task:', error));
}

setInterval(fetchSystemInfo, 1000);
setInterval(fetchProcesses, 1000);
fetchSystemInfo();
