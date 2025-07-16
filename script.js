document.addEventListener('DOMContentLoaded', function() {
    // ------------------- CONFIGURATION -------------------
    const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJ_pSzX4QdrWCJ5OnpxLo-aKyK9SaJM4pTgyeQ7RYuiKn0eeMQmUWaJOVdwHP30Azmlg/exec';

    const targetUrl = 'https://capareseau.fr/';
    const downText = 'Site momentanément indisponible';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    // -----------------------------------------------------

    const statusDiv = document.getElementById('status');
    const statusHeader = statusDiv.querySelector('h2');
    const lastCheckedSpan = document.getElementById('last-checked');
    const uptimeRateSpan = document.getElementById('uptime-rate');

    async function logStatusToSheet(status) {
        try {
            await fetch(GOOGLE_APP_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: status })
            });
        } catch (error) {
            console.error('Error logging to Google Sheet:', error);
        }
    }
    
    // This function is now much simpler!
    async function calculateAndDisplayUptime() {
        uptimeRateSpan.textContent = 'Calculating...';
        try {
            const response = await fetch(GOOGLE_APP_SCRIPT_URL); // This is a GET request
            const result = await response.json();
            
            if (result.uptimePercentage !== undefined) {
                uptimeRateSpan.textContent = `${result.uptimePercentage}%`;
            } else {
                throw new Error('Invalid data received from API');
            }
        } catch (error) {
            console.error('Could not calculate uptime:', error);
            uptimeRateSpan.textContent = 'Error';
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
            await calculateAndDisplayUptime();
        }
    }

    checkStatus();
    setInterval(checkStatus, 300000); // Re-check every 5 minutes
});
