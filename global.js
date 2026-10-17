
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
