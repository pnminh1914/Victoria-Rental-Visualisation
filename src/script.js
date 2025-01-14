const startYear = 2025;
const endYear = 2027;
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

const mapList = document.getElementById('map-list');
const mapFrame = document.getElementById('map-frame');
const backButton = document.getElementById('back-button');

// Function to clear the active class from all links
function clearActiveClass() {
    const links = mapList.querySelectorAll('a');
    links.forEach(link => link.classList.remove('active'));
}

// Dynamically populate the sidebar with map links
for (let year = startYear; year <= endYear; year++) {
    for (const quarter of quarters) {
        const fileName = `../resources/${year}${quarter}.html`;

        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = "#";
        link.textContent = `${year} ${quarter}`;
        link.addEventListener('click', () => {
            mapFrame.src = fileName;
            mapFrame.style.display = 'block';
            backButton.classList.remove('hidden');

            // Highlight the selected link
            clearActiveClass();
            link.classList.add('active');
        });

        listItem.appendChild(link);
        mapList.appendChild(listItem);
    }
}

// Back button functionality
backButton.addEventListener('click', () => {
    mapFrame.src = "";
    mapFrame.style.display = 'none';
    backButton.classList.add('hidden');
    clearActiveClass();
});