document.addEventListener('DOMContentLoaded', function() {
    // The URL of the site to check
    const targetUrl = 'https://capareseau.fr/';

    // The text that indicates the site is down, despite a 200 OK status
    const downText = 'Site momentanément indisponible';

    // We use a CORS proxy to bypass browser security restrictions
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    // Get the HTML elements we need to update
    const statusDiv = document.getElementById('status');
    const statusHeader = statusDiv.querySelector('h2');
    const lastCheckedSpan = document.getElementById('last-checked');

    async function checkStatus() {
        // Reset to loading state
        statusDiv.className = 'loading';
        statusHeader.textContent = 'Checking...';

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            
            const data = await response.json();
            const siteContent = data.contents;

            // Check if the "down text" is present in the fetched HTML
            if (siteContent && siteContent.includes(downText)) {
                // If text is found, the site is DOWN
                statusDiv.className = 'down';
                statusHeader.textContent = 'YES 🔴';
            } else {
                // Otherwise, the site is UP
                statusDiv.className = 'up';
                statusHeader.textContent = 'NO 🟢';
            }

        } catch (error) {
            // If the fetch fails for any reason
            console.error('Fetch Error:', error);
            statusDiv.className = 'down';
            statusHeader.textContent = 'Error ⚠️';
        } finally {
            // Update the timestamp regardless of the outcome
            lastCheckedSpan.textContent = new Date().toLocaleString('fr-FR');
        }
    }

    // Run the check when the page loads
    checkStatus();
});
