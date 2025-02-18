function createChart(ctx, label, data, colors) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [''],
            datasets: data.map((d, index) => ({
                label: label[index],
                data: [d],
                borderColor: colors[index],
                fill: false,
                pointStyle: 'circle',
                pointRadius: 0,
                borderWidth: 2
            }))
        },
        options: {
            maintainAspectRatio: false,
            responsive: true
        }
    });
}

function updateChart(chart, newData) {
    chart.data.labels.push('');
    if (chart.data.labels.length > 60) {
        chart.data.labels.shift();
    }
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(newData);
        if (dataset.data.length > 60) {
            dataset.data.shift();
        }
    });
    chart.update();
}

function updateDiskChart(chart, diskRead, diskWrite) {
    chart.data.labels.push('');
    if (chart.data.labels.length > 60) {
        chart.data.labels.shift();
    }
    chart.data.datasets[0].data.push(diskRead);
    chart.data.datasets[1].data.push(diskWrite);

    if (chart.data.datasets[0].data.length > 60) {
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }
    chart.update();
}

function updateNetworkChart(chart, networkDownload, networkUpload) {
    chart.data.labels.push('');
    if (chart.data.labels.length > 60) {
        chart.data.labels.shift();
    }
    chart.data.datasets[0].data.push(networkDownload);
    chart.data.datasets[1].data.push(networkUpload);

    if (chart.data.datasets[0].data.length > 60) {
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }
    chart.update();
}

function initializeCharts(processData) {
    const cpuChart = createChart(document.getElementById('cpuChart').getContext('2d'),
        ['CPU Usage (%)'], [processData.cpu_usage], ['rgba(255, 99, 132, 1)']);
    const memoryChart = createChart(document.getElementById('memoryChart').getContext('2d'),
        ['Memory Usage (%)'], [processData.memory_usage], ['rgba(54, 162, 235, 1)']);
    const diskChart = createChart(document.getElementById('diskChart').getContext('2d'),
        ['Disk Read (MB)', 'Disk Write (MB)'],
        [processData.disk_read, processData.disk_write],
        ['rgba(255, 159, 64, 1)', 'rgba(54, 162, 235, 1)']);
    const networkChart = createChart(document.getElementById('networkChart').getContext('2d'),
        ['Network Download (MB)', 'Network Upload (MB)'],
        [processData.network_download, processData.network_upload],
        ['rgba(153, 102, 255, 1)', 'rgba(75, 192, 192, 1)']);

    function updateProcessCharts() {
        fetch(`/api/processes`)
            .then(response => response.json())
            .then(data => {
                const process = data.find(p => p.pid === processData.pid);
                if (process) {
                    updateChart(cpuChart, process.cpu_percent);
                    updateChart(memoryChart, process.memory_percent);
                    updateDiskChart(diskChart, process.disk_read, process.disk_write);
                    updateNetworkChart(networkChart, process.network_download, process.network_upload);
                }
            })
            .catch(error => console.error('Error fetching process data:', error));
    }

    setInterval(updateProcessCharts, 1000);
}
