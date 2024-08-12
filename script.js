document.getElementById('showpassword').addEventListener('change', function () {
    var passwordField = document.getElementById('password');
    if (this.checked) {
        passwordField.type = 'text';
    } else {
        passwordField.type = 'password';
    }
});
function showHome() {
    document.getElementById('homeContent').style.display = 'block';
    document.getElementById('monitorContent').style.display = 'none';
    document.getElementById('dataContent').style.display = 'none';
    document.getElementById('errorContent').style.display = 'none';
}

function showMonitor() {
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('monitorContent').style.display = 'flex';
    document.getElementById('dataContent').style.display = 'none';
    document.getElementById('errorContent').style.display = 'none';
    startFetchingData();
}

function showDATA() {
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('monitorContent').style.display = 'none';
    document.getElementById('dataContent').style.display = 'block';
    document.getElementById('errorContent').style.display = 'none';
    fetchData();
    startFetchingData1()
}

function showERROR() {
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('monitorContent').style.display = 'none';
    document.getElementById('dataContent').style.display = 'none';
    document.getElementById('errorContent').style.display = 'block';
    fetchErrorData();
    startFetchingErrorData();
}

async function fetchLatestData() {
    try {
        const response = await fetch('fetch_latest_data.php');
        const data = await response.json();

        document.getElementById('pressureValue').innerText = data.Pressure;
        document.getElementById('rpm1Value').innerText = data.RPM1;
        document.getElementById('rpm2Value').innerText = data.RPM2;
        document.getElementById('frequency1Value').innerText = data.Frequency1;
        document.getElementById('frequency2Value').innerText = data.Frequency2;

        updatePressureChart(data.Pressure);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function startFetchingData() {
    setInterval(fetchLatestData, 1000);  // Fetch data every second
}

async function fetchData() {
    try {
        const response = await fetch('fetch_pressure_data2.php');
        const data = await response.json();

        const tableBody = document.querySelector('#data-table tbody');
        tableBody.innerHTML = '';

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.id}</td>
                <td>${row.Pressure}</td>
                <td>${row.RPM1}</td>
                <td>${row.RPM2}</td>
                <td>${row.Frequency1}</td>
                <td>${row.Frequency2}</td>
                <td>${row.data_setpoint}</td>
                <td>${row.date_Pressure}</td>
                <td>${row.time_Pressure}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function startFetchingData1() {
    setInterval(fetchData, 1000);  // Fetch data every second
}

async function fetchErrorData() {
    try {
        const response = await fetch('fetch_error_data.php');
        const data = await response.json();

        const tableBody = document.querySelector('#error-table tbody');
        tableBody.innerHTML = '';

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.id}</td>
                <td>${row.errorname}</td>
                <td>${row.data_error}</td>
                <td>${row.date_error}</td>
                <td>${row.time_error}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching error data:', error);
    }
}

function startFetchingErrorData() {
    setInterval(fetchErrorData, 1000);  // Fetch error data every second
}
