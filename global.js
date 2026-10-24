console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// Navigation links
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/JamesDrQ', title: 'GitHub' },
];

// Base path for local server and GitHub Pages
const BASE_PATH =
    (location.hostname === 'localhost' ||
     location.hostname === '127.0.0.1')
        ? '/'
        : '/portfolio/';

// Create navigation menu
let nav = document.createElement('nav');
document.body.prepend(nav);

// Add navigation links
for (let p of pages) {
    let url = p.url;
    let title = p.title;

    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    if (a.host !== location.host) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
    }
    nav.append(a);
}


document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `
);

let select = document.querySelector('.color-scheme select');

// Restore saved theme when page loads
if ('colorScheme' in localStorage) {
    select.value = localStorage.colorScheme;

    document.documentElement.style.setProperty(
        'color-scheme',
        localStorage.colorScheme
    );
}

// Update and save theme when changed
select.addEventListener('input', function (event) {
    let colorScheme = event.target.value;

    document.documentElement.style.setProperty(
        'color-scheme',
        colorScheme
    );

    localStorage.colorScheme = colorScheme;
});

// Highlight current page
let navLinks = $$('nav a');

let currentLink = navLinks.find(
    (a) => a.host === location.host &&
           a.pathname === location.pathname
);

currentLink?.classList.add('current');

const form = document.querySelector('form');

if (form) {
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const data = new FormData(form);
        const subject = data.get('subject');
        const body = data.get('body');

        const url = `mailto:jjqian@ucsd.edu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        location.href = url;
    });
}

export async function fetchJSON(url) {
  try {
    // 1. Fetch JSON data
    const response = await fetch(url);

    // 2. Inspect the response
    console.log(response);

    // 3. Check for errors
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    // 4. Parse JSON
    const data = await response.json();

    // 5. Return data
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    return null;
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Check if the container is valid
  if (!containerElement) {
    console.error('Projects container not found');
    return;
  }

  // Clear existing content
  containerElement.innerHTML = '';

  // Check if projects data is valid
  if (!Array.isArray(projects) || projects.length === 0) {
    containerElement.textContent = 'No projects available.';
    return;
  }

  // Validate heading level
  if (!/^h[1-6]$/.test(headingLevel)) {
    headingLevel = 'h2';
  }

  // Create an article for each project
  projects.forEach((project) => {
    const article = document.createElement('article');

    article.innerHTML = `
      <${headingLevel}>${project.title ?? 'Untitled Project'}</${headingLevel}>
      ${project.image ? `<img src="${project.image}" alt="${project.title ?? 'Project image'}">` : ''}
      <p>${project.description ?? ''}</p>
    `;

    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/JamesDrQ`);
}
