// This function needs to be in the global scope so the script returned from Google can call it.
function handleData(data) {
    const uptimeRateSpan = document.getElementById('uptime-rate');
    const chartCanvas = document.getElementById('uptimeChart');
    let uptimeChartInstance = window.uptimeChartInstance || null;

    if (data && !data.error && data.length > 0) {
        uptimeRateSpan.textContent = `${calculateUptime(data)}%`;
        drawUptimeChart(data);
    } else {
        uptimeRateSpan.textContent = 'N/A';
        if (data.error) {
            console.error("Error from Google Script:", data.message);
        }
    }

    // --- Helper functions for processing data ---
    function calculateUptime(data) {
        if (data.length < 2) return (data.length === 1 && data[0][1] === 'UP') ? '100.00' : '0.00';
        let totalUpTimeMs = 0;
        const now = new Date();
        for (let i = 0; i < data.length - 1; i++) {
            if (data[i][1] === 'UP') {
                totalUpTimeMs += new Date(data[i + 1][0]).getTime() - new Date(data[i][0]).getTime();
            }
        }
        if (data[data.length - 1][1] === 'UP') {
            totalUpTimeMs += now.getTime() - new Date(data[data.length - 1][0]).getTime();
        }
        const totalMonitoredTimeMs = now.getTime() - new Date(data[0][0]).getTime();
        const percentage = totalMonitoredTimeMs > 0 ? (totalUpTimeMs / totalMonitoredTimeMs) * 100 : 0;
        return percentage.toFixed(2);
    }

    function drawUptimeChart(data) {
        if (uptimeChartInstance) {
            uptimeChartInstance.destroy();
        }
        const chartData = data.map(row => ({
            x: new Date(row[0]),
            y: row[1] === 'UP' ? 1 : 0
        }));
        window.uptimeChartInstance = new Chart(chartCanvas, {
            type: 'line',
            data: { datasets: [{ label: 'Status', data: chartData, borderColor: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.1)', stepped: true, fill: true, }] },
            options: {
                scales: { x: { type: 'time', time: { unit: 'day' } }, y: { ticks: { stepSize: 1, callback: value => (value === 1 ? 'UP' : 'DOWN') }, min: -0.1, max: 1.1 } },
                plugins: { legend: { display: false } }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJ_pSzX4QdrWCJ5OnpxLo-aKyK9SaJM4pTgyeQ7RYuiKn0eeMQmUWaJOVdwHP30Azmlg/exec';
    const targetUrl = 'https://capareseau.fr/';
    const downText = 'Site momentanément indisponible';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    const statusDiv = document.getElementById('status');
    const statusHeader = statusDiv.querySelector('h2');
    const lastCheckedSpan = document.getElementById('last-checked');

    // This function now uses the JSONP method (injecting a script tag)
    function processHistoricalData() {
        // Remove old script tag if it exists
        const oldScript = document.getElementById('jsonp_script');
        if (oldScript) {
            oldScript.remove();
        }
        const script = document.createElement('script');
        script.id = 'jsonp_script';
        // The callback parameter tells Google which function to wrap the data in.
        script.src = `${GOOGLE_APP_SCRIPT_URL}?callback=handleData`;
        document.body.appendChild(script);
    }

    async function logStatusToSheet(status) {
        try {
            await fetch(GOOGLE_APP_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ status: status }) });
        } catch (error) {
            console.error('Error logging to Google Sheet:', error);
        }
    }

    async function checkStatus() {
        statusDiv.className = 'loading';
        statusHeader.textContent = 'Checking...';
        let currentStatus = 'DOWN';
        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const siteContent = data.contents;
            if (siteContent && !siteContent.includes(downText)) {
                currentStatus = 'UP';
                statusDiv.className = 'up';
                statusHeader.textContent = 'NO 🟢';
            } else {
                statusDiv.className = 'down';
                statusHeader.textContent = 'YES 🔴';
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            statusDiv.className = 'down';
            statusHeader.textContent = 'Error ⚠️';
        } finally {
            lastCheckedSpan.textContent = new Date().toLocaleString('fr-FR');
            await logStatusToSheet(currentStatus);
            processHistoricalData(); // Refresh uptime rate and chart using JSONP
        }
    }

    // Initial load
    checkStatus();
    setInterval(checkStatus, 300000);
});
