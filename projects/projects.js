import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// State
let query = '';
let selectedYear = null;

// Fetch project data
const projects = await fetchJSON('../lib/projects.json');

// Select containers
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

// Set up D3
const arcGenerator = d3.arc()
  .innerRadius(0)
  .outerRadius(50);

const sliceGenerator = d3.pie()
  .value((d) => d.value);

// Keep each year's color consistent
const years = [...new Set(
  projects.map((project) => String(project.year))
)].sort();

const colors = d3.scaleOrdinal()
  .domain(years)
  .range(d3.schemeTableau10);

// Toggle selected year
function toggleYear(year) {
  selectedYear = selectedYear === year ? null : year;
  updateView();
}

// Render pie chart and legend
function renderPieChart(projectsGiven) {
  // Group projects by year
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => String(d.year)
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  // Generate pie slices
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((d) => arcGenerator(d));

  // Clear previous chart
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  // Draw slices
  arcs.forEach((arc, idx) => {
    const year = String(data[idx].label);

    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(year))
      .classed('selected', selectedYear === year)
      .on('click', () => toggleYear(year));
  });

  // Clear previous legend
  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // Draw legend
  data.forEach((d) => {
    const year = String(d.label);

    legend
      .append('li')
      .attr('class', 'legend-item')
      .classed('selected', selectedYear === year)
      .attr('style', `--color: ${colors(year)}`)
      .html(
        `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
      )
      .on('click', () => toggleYear(year));
  });
}

// Apply search and year filters together
function updateView() {
  // First: filter by search query
  const searchResults = projects.filter((project) => {
    const values = Object.values(project)
      .join(' ')
      .toLowerCase();

    return values.includes(query);
  });

  // Second: filter by selected year
  const visibleProjects = searchResults.filter((project) => {
    return selectedYear === null ||
      String(project.year) === selectedYear;
  });

  // Update project cards and title
  renderProjects(visibleProjects, projectsContainer, 'h2');
  projectsTitle.textContent = `${visibleProjects.length} Projects`;

  // Pie chart reflects search results
  renderPieChart(searchResults);
}

// Search functionality
searchInput.addEventListener('input', (event) => {
  query = event.target.value.trim().toLowerCase();
  updateView();
});

// Initial render
updateView();
