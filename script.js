document.addEventListener('DOMContentLoaded', function() {
    // ------------------- CONFIGURATION -------------------
    // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
    const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJ_pSzX4QdrWCJ5OnpxLo-aKyK9SaJM4pTgyeQ7RYuiKn0eeMQmUWaJOVdwHP30Azmlg/exec';

    const targetUrl = 'https://capareseau.fr/';
    const downText = 'Site momentanément indisponible';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    // -----------------------------------------------------

    const statusDiv = document.getElementById('status');
    const statusHeader = statusDiv.querySelector('h2');
    const lastCheckedSpan = document.getElementById('last-checked');
    const uptimeRateSpan = document.getElementById('uptime-rate');

    // Function to log the status to your Google Sheet
    async function logStatusToSheet(status) {
        try {
            await fetch(GOOGLE_APP_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Important for simple "fire-and-forget" POSTs
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status })
            });
        } catch (error) {
            console.error('Error logging to Google Sheet:', error);
        }
    }
    
    // Function to fetch all data and calculate uptime
    async function calculateAndDisplayUptime() {
        try {
            const response = await fetch(GOOGLE_APP_SCRIPT_URL);
            const data = await response.json();
            
            let upCount = 0;
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const recentData = data.filter(row => new Date(row[0]) > ninetyDaysAgo);

            if (recentData.length === 0) {
                 uptimeRateSpan.textContent = 'N/A';
                 return;
            }

            recentData.forEach(row => {
                if (row[1] === 'UP') {
                    upCount++;
                }
            });

            const uptimePercentage = (upCount / recentData.length) * 100;
            uptimeRateSpan.textContent = `${uptimePercentage.toFixed(2)}%`;

        } catch (error) {
            console.error('Could not calculate uptime:', error);
            uptimeRateSpan.textContent = 'Error';
        }
    }


    // Main function to check the site status
    async function checkStatus() {
        statusDiv.className = 'loading';
        statusHeader.textContent = 'Checking...';
        let currentStatus = 'DOWN'; // Default to DOWN

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
            // Log the result to the sheet and then update the uptime display
            await logStatusToSheet(currentStatus);
            await calculateAndDisplayUptime();
        }
    }

    // Run everything on page load
    checkStatus();

    // Optional: Auto-refresh every 5 minutes
    setInterval(checkStatus, 300000); // 300,000 milliseconds = 5 minutes
});
