import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Fetch and render latest projects
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects ? projects.slice(0, 3) : [];

const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');

// Fetch GitHub profile data
const githubData = await fetchGitHubData('JamesDrQ');
console.log(githubData);

// Select GitHub stats container
const profileStats = document.querySelector('#profile-stats');

// Render GitHub stats
if (profileStats && githubData) {
  profileStats.innerHTML = `
    <dl>
      <dt>Public Repos:</dt>
      <dd>${githubData.public_repos}</dd>

      <dt>Public Gists:</dt>
      <dd>${githubData.public_gists}</dd>

      <dt>Followers:</dt>
      <dd>${githubData.followers}</dd>

      <dt>Following:</dt>
      <dd>${githubData.following}</dd>
    </dl>
  `;
}
