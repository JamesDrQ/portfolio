import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}


function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      // Each group contains lines associated with one commit
      let first = lines[0];

      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/JamesDrQ/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,

        // Convert commit time to a decimal hour
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,

        // Number of lines associated with this commit
        totalLines: lines.length,
      };

      // Keep the original lines without displaying them by default
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats')
    .append('dl')
    .attr('class', 'stats');

  // Total lines of code
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Number of files
  dl.append('dt').text('Total files');
  dl.append('dd').text(d3.group(data, d => d.file).size);

  // Average line length
  dl.append('dt').text('Average line length');
  dl.append('dd').text(d3.mean(data, d => d.length).toFixed(1));

  // Longest line
  dl.append('dt').text('Longest line');
  dl.append('dd').text(d3.max(data, d => d.length));

  // Maximum indentation depth
  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(d3.max(data, d => d.depth));
}


function renderScatterPlot(data, commits) {
  // Dimensions
  const width = 1000;
  const height = 600;

  // Margins for axes
  const margin = {
    top: 10,
    right: 10,
    bottom: 30,
    left: 20
  };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };

  // Create SVG
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // X scale: commit dates
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  // Y scale: time of day
  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Add horizontal gridlines
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );

  // Create axes
  const xAxis = d3.axisBottom(xScale).ticks(6);

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  
  // Calculate minimum and maximum lines edited
  const [minLines, maxLines] = d3.extent(
    commits,
    d => d.totalLines
  );

  // Map line counts to circle radii
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(
    commits,
    d => -d.totalLines
  );

  // Draw dots
  const dots = svg.append('g').attr('class', 'dots');
  
  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 1);

      renderTooltipContent(commit);
      updateTooltipPosition(event);
      updateTooltipVisibility(true);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget)
        .style('fill-opacity', 0.7);

      updateTooltipVisibility(false);
    });

  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter(d => isCommitSelected(selection, d))
      : [];

    const countElement = document.querySelector('#selection-count');

    countElement.textContent =
      `${selectedCommits.length || 'No'} commits selected`;

    return selectedCommits;
  }

  function renderLanguageBreakdown(selection) {
    // Get selected commits
    const selectedCommits = selection
      ? commits.filter(d => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');

    // Clear results when nothing is selected
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }

    // Collect all code lines from selected commits
    const lines = selectedCommits.flatMap(d => d.lines);

    // Count lines for each language
    const breakdown = d3.rollup(
      lines,
      v => v.length,
      d => d.type
    );

    // Render results
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');

      dt.textContent = language;
      dd.textContent = `${count} lines (${formatted})`;

      container.append(dt, dd);
    }
  }


  // Check whether a commit is inside the selection
  function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }

    const [[x0, y0], [x1, y1]] = selection;

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return (
      x >= x0 &&
      x <= x1 &&
      y >= y0 &&
      y <= y1
    );
  }

  // Update dots when brushing
  
  function brushed(event) {
    const selection = event.selection;

    dots.selectAll('circle')
        .classed('selected', d =>
          isCommitSelected(selection, d)
        )
        .classed('dimmed', d =>
          selection !== null &&
          !isCommitSelected(selection, d)
        );

    renderSelectionCount(selection);
  }

  // Update language stats only when brushing ends
  function brushEnded(event) {
    renderLanguageBreakdown(event.selection);
  }

  // Initialize brush
  createBrushSelector(svg, brushed, brushEnded);
}

function createBrushSelector(svg, brushed, brushEnded) {
  const brush = d3.brush()
    .on('start brush end', brushed)
    .on('end.language', brushEnded);

  svg.call(brush);
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function renderTooltipContent(commit) {
  if (!commit) return;

  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.textContent = commit.id;
  link.href = commit.url;

  date.textContent = commit.datetime.toLocaleDateString('en-US', {
    dateStyle: 'full',
  });

  time.textContent = commit.datetime.toLocaleTimeString('en-US');

  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}


function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}


function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');

  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

// Load and process the data
let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);