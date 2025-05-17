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
    content.innerHTML = `<p>Welcome to the Victoria Future Median Rental Price Prediction tool. Use the topbar to navigate.</p>`;
}

// Show Map Visualization
function showMapVisualization() {
    content.innerHTML = `
        <div class="map-visualization-container">
            <div class="map-options">
                <div class="form-label" style="margin-bottom: 6px; font-weight: 500;">Choose a quarter:</div>
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
    mapContainer.innerHTML = `<iframe src="resources/${quarter}.html" width="100%" height="600px" frameborder="0"></iframe>`;
}

// Show Suburb Visualization
function showSuburbVisualization() {
    content.innerHTML = `
        <div class="suburb-visualization-container">
            <div class="suburb-form-container">
                <div class="form-label" style="margin-bottom: 6px; font-weight: 500;">Search for a suburb:</div>
                <div class="suburb-search-container">
                    <input type="text" id="dropdown-search" placeholder="Type to search suburbs..." autocomplete="off">
                    <div id="dropdown-options" class="dropdown-options"></div>
                </div>
                <div class="selected-suburbs"></div>
                <div class="suburb-form-content">
                    <p id="selected-count">Selected: 0 / 5</p>
                    <label for="start-year">Start Year:</label>
                    <input type="number" id="start-year" min="2000" max="2027" value="2000">
                    <div><button id="apply-btn">Apply</button></div>
                </div>
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
    fetch('resources/concatenated.csv')
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
    const selectedSuburbsContainer = document.querySelector('.selected-suburbs');
    let selectedSuburbs = [];
    const MAX_SUBURBS = 5;

    // Display dropdown when clicking on the input
    dropdownSearch.addEventListener('focus', () => {
        dropdownOptions.classList.add('active');
        populateDropdownOptions(suburbs);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', event => {
        if (!dropdownOptions.contains(event.target) && event.target !== dropdownSearch) {
            dropdownOptions.classList.remove('active');
        }
    });

    // Typing suggestions
    dropdownSearch.addEventListener('input', () => {
        const query = dropdownSearch.value.toLowerCase();
        const filteredSuburbs = suburbs.filter(suburb => suburb.toLowerCase().includes(query));
        populateDropdownOptions(filteredSuburbs);
        dropdownOptions.classList.add('active');
    });

    // Populate dropdown options
    function populateDropdownOptions(filteredSuburbs) {
        dropdownOptions.innerHTML = '';
        filteredSuburbs.forEach(suburb => {
            const option = document.createElement('div');
            option.classList.add('dropdown-option');
            if (selectedSuburbs.includes(suburb)) {
                option.classList.add('selected');
            }
            option.textContent = suburb;

            option.addEventListener('click', () => {
                if (selectedSuburbs.includes(suburb)) {
                    selectedSuburbs = selectedSuburbs.filter(s => s !== suburb);
                    option.classList.remove('selected');
                } else if (selectedSuburbs.length < MAX_SUBURBS) {
                    selectedSuburbs.push(suburb);
                    option.classList.add('selected');
                } else {
                    alert(`You can select a maximum of ${MAX_SUBURBS} suburbs.`);
                }
                updateSelectedSuburbs();
                updateSelectedCount();
                dropdownOptions.classList.remove('active');
            });

            dropdownOptions.appendChild(option);
        });
    }

    function updateSelectedSuburbs() {
        selectedSuburbsContainer.innerHTML = '';
        selectedSuburbs.forEach(suburb => {
            const suburbElement = document.createElement('div');
            suburbElement.classList.add('selected-suburb');
            suburbElement.innerHTML = `
                <span>${suburb}</span>
                <span class="delete-suburb">×</span>
            `;

            // Add delete functionality
            const deleteButton = suburbElement.querySelector('.delete-suburb');
            deleteButton.addEventListener('click', () => {
                selectedSuburbs = selectedSuburbs.filter(s => s !== suburb);
                updateSelectedSuburbs();
                updateSelectedCount();
            });

            selectedSuburbsContainer.appendChild(suburbElement);
        });
    }

    function updateSelectedCount() {
        selectedCount.textContent = `Selected: ${selectedSuburbs.length} / ${MAX_SUBURBS}`;
    }

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
    fetch('resources/concatenated.csv')
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
            chart.draw(dataTable, {
                title: 'Rental Price Predictions',
                curveType: 'function',
                legend: { position: 'bottom', maxLines: 10 }
            });
        });
}