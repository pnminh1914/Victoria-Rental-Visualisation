// Load Google Charts
google.charts.load('current', {'packages':['corechart', 'line']});

// Elements
const content = document.getElementById('content');
const landingPageBtn = document.getElementById('landing-page-btn');
const mapVisualizationBtn = document.getElementById('map-visualization-btn');
const suburbVisualizationBtn = document.getElementById('suburb-visualization-btn');

// Event Listeners
landingPageBtn.addEventListener('click', showLandingPage);
mapVisualizationBtn.addEventListener('click', showMapVisualization);
suburbVisualizationBtn.addEventListener('click', showSuburbVisualization);

// Show Landing Page
function showLandingPage() {
    content.innerHTML = `<p>Welcome to the Victoria Future Median Rental Price Prediction tool. Use the sidebar to navigate.</p>`;
}

// Show Map Visualization
function showMapVisualization() {
    content.innerHTML = `
        <div class="map-visualization-container">
            <div class="map-options">
                <h3>Choose a Quarter</h3>
                <ul id="map-list"></ul>
            </div>
            <div id="map-container">
                <p>Select a quarter to display the map.</p>
            </div>
        </div>
    `;
    populateMapOptions();
}

// Populate Map Options
function populateMapOptions() {
    const validQuarters = ['2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1', '2026Q2', '2026Q3', '2026Q4', '2027Q1', '2027Q2', '2027Q3', '2027Q4'];
    const mapList = document.getElementById('map-list');

    validQuarters.forEach(quarter => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = quarter;
        link.addEventListener('click', () => loadMap(quarter));
        li.appendChild(link);
        mapList.appendChild(li);
    });
}

// Load Map
function loadMap(quarter) {
    const mapContainer = document.getElementById('map-container');
    mapContainer.innerHTML = `<iframe src="../resources/${quarter}.html" width="100%" height="600px" frameborder="0"></iframe>`;
}

// Show Suburb Visualization
function showSuburbVisualization() {
    content.innerHTML = `
        <div class="suburb-visualization-container">
            <div class="suburb-form-container">
                <h3>Suburb Visualization</h3>
                <form id="suburb-form">
                    <label for="suburbs">Choose Suburbs (1-5):</label><br>
                    <div id="suburb-options"></div>
                    <label for="start-year">Start Year:</label>
                    <input type="number" id="start-year" min="2000" max="2027" value="2000">
                    <button type="submit">Apply</button>
                </form>
            </div>
            <div id="chart-container">
                <p>Select suburbs and a start year to display the chart.</p>
            </div>
        </div>
    `;
    loadSuburbOptions();
}

// Load Suburb Options
function loadSuburbOptions() {
    fetch('../resources/concatenated.csv')
        .then(response => response.text())
        .then(csvText => {
            const suburbs = csvText.split('\n').slice(1).map(row => row.split(',')[0]);
            const suburbOptions = document.getElementById('suburb-options');
            
            suburbs.forEach(suburb => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'suburbs';
                checkbox.value = suburb;
                checkbox.addEventListener('change', handleSuburbSelection);
                
                suburbOptions.appendChild(checkbox);
                suburbOptions.appendChild(document.createTextNode(suburb));
                suburbOptions.appendChild(document.createElement('br'));
            });
        });
}

// Handle Suburb Selection
function handleSuburbSelection() {
    const selectedSuburbs = document.querySelectorAll('input[name="suburbs"]:checked');
    if (selectedSuburbs.length > 3) {
        alert('You can select a maximum of 3 suburbs.');
        this.checked = false; // Uncheck the last selected box
    }
}

// Suburb Form Submission
content.addEventListener('submit', function(event) {
    event.preventDefault();
    const selectedSuburbs = Array.from(document.querySelectorAll('input[name="suburbs"]:checked')).map(cb => cb.value);
    const startYear = parseInt(document.getElementById('start-year').value);

    if (selectedSuburbs.length === 0) {
        alert('Please select at least one suburb.');
        return;
    }

    visualizeSuburbData(selectedSuburbs, startYear);
});

// Visualize Suburb Data
function visualizeSuburbData(suburbs, startYear) {
    fetch('../resources/concatenated.csv')
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.split('\n').map(row => row.split(','));
            const quarters = rows[0].slice(1);
            const dataTable = new google.visualization.DataTable();

            dataTable.addColumn('string', 'Quarter');
            suburbs.forEach(suburb => dataTable.addColumn('number', suburb));

            quarters.forEach((quarter, i) => {
                if (parseInt(quarter.split('Q')[0]) >= startYear) {
                    const row = [quarter];
                    suburbs.forEach(suburb => {
                        const suburbRow = rows.find(r => r[0] === suburb);
                        row.push(parseFloat(suburbRow[i + 1]) || 0);
                    });
                    dataTable.addRow(row);
                }
            });

            const chart = new google.visualization.LineChart(document.getElementById('chart-container'));
            chart.draw(dataTable, { title: 'Rental Price Predictions', curveType: 'function', legend: { position: 'bottom' } });
        });
}