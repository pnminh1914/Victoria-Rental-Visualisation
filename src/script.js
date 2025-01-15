// Load Google Charts
google.charts.load('current', { 'packages': ['corechart', 'line'] });

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

// Populate Map Options with Buttons
function populateMapOptions() {
    const validQuarters = ['2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1', '2026Q2', '2026Q3', '2026Q4', '2027Q1', '2027Q2', '2027Q3', '2027Q4'];
    const mapList = document.getElementById('map-list'); // This can now be a <div>

    validQuarters.forEach(quarter => {
        const button = document.createElement('button');

        // Style the button
        button.textContent = quarter;
        button.classList.add('map-button'); // Add a class for custom styling
        button.addEventListener('click', () => loadMap(quarter));

        mapList.appendChild(button);
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
                <div class="dropdown">
                    <input type="text" id="dropdown-search" placeholder="Type to search suburbs..." autocomplete="off">
                    <div id="dropdown-options" class="dropdown-options"></div>
                </div>
                <p id="selected-count">Selected: 0 / 3</p>
                <label for="start-year">Start Year:</label>
                <input type="number" id="start-year" min="2000" max="2027" value="2000">
                <button id="apply-btn">Apply</button>
            </div>
            <div id="chart-container">
                <p>Select suburbs and a start year to display the chart.</p>
            </div>
        </div>
    `;
    loadSuburbOptions();
}

// Load Suburb Options and Initialize Dropdown
function loadSuburbOptions() {
    fetch('../resources/concatenated.csv')
        .then(response => response.text())
        .then(csvText => {
            const suburbs = csvText.split('\n').slice(1).map(row => row.split(',')[0]).filter(Boolean);
            initializeDropdown(suburbs);
        });
}

function initializeDropdown(suburbs) {
    const dropdownSearch = document.getElementById('dropdown-search');
    const dropdownOptions = document.getElementById('dropdown-options');
    const selectedCount = document.getElementById('selected-count');
    let selectedSuburbs = [];

    // Display dropdown when clicking on the input
    dropdownSearch.addEventListener('focus', () => {
        dropdownOptions.style.display = 'block';
        populateDropdownOptions(suburbs);
    });

    // Typing suggestions
    dropdownSearch.addEventListener('input', () => {
        const query = dropdownSearch.value.toLowerCase();
        const filteredSuburbs = suburbs.filter(suburb => suburb.toLowerCase().includes(query));
        populateDropdownOptions(filteredSuburbs);
    });

// Populate dropdown options
function populateDropdownOptions(filteredSuburbs) {
    dropdownOptions.innerHTML = '';
    filteredSuburbs.forEach(suburb => {
        const option = document.createElement('div');
        option.classList.add('dropdown-option');
        option.textContent = suburb;

        option.addEventListener('click', () => {
            if (selectedSuburbs.includes(suburb)) {
                selectedSuburbs = selectedSuburbs.filter(s => s !== suburb);
            } else if (selectedSuburbs.length < 3) {
                selectedSuburbs.push(suburb);
            } else {
                alert('You can select a maximum of 3 suburbs.');
            }
            updateSelectedCount();
            highlightSelectedOptions();
        });

        dropdownOptions.appendChild(option);
    });
}

function updateSelectedCount() {
    selectedCount.textContent = `Selected: ${selectedSuburbs.length} / 3`;
}

function highlightSelectedOptions() {
    document.querySelectorAll('.dropdown-option').forEach(option => {
        if (selectedSuburbs.includes(option.textContent)) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

    // Hide dropdown when clicking outside
    document.addEventListener('click', event => {
        if (!dropdownOptions.contains(event.target) && event.target !== dropdownSearch) {
            dropdownOptions.style.display = 'none';
        }
    });

    // Prevent hiding dropdown when clicking inside
    dropdownOptions.addEventListener('click', event => {
        event.stopPropagation();
    });

    document.getElementById('apply-btn').addEventListener('click', () => {
        const startYear = parseInt(document.getElementById('start-year').value);
        if (selectedSuburbs.length === 0) {
            alert('Please select at least one suburb.');
            return;
        }
        visualizeSuburbData(selectedSuburbs, startYear);
    });
}

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