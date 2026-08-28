const GITHUB_REPO = "gif-website-tempname";
const BRANCH = "main";
const FOLDER = "gifs";

const apiUrl = `https://api.github.com/repos/dognjuyoir/${GITHUB_REPO}/contents/${FOLDER}?ref=${BRANCH}`;

const grid = document.getElementById("grid");
const status = document.getElementById("status");
const search = document.getElementById("search");

let allGifs = [];
let TAGS = {};

function getTags(filename) {
  return TAGS[filename] || [];
}

function displayName(filename) {
    return filename.replace(/\.gif$/i, "").replace(/-/g, " ");
}

function gifUrl(filename) {
    return `https://dognjuyoir.github.io/${GITHUB_REPO}/gifs/${filename}`;
}

const toast = document.getElementById("toast");
let toastTimeout;

function showToast(message) {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 1200);
}

function render(list) {
    grid.innerHTML = "";
    if (list.length === 0) {
    status.textContent = "No gifs match your search.";
    return;
    }
    status.textContent = `${list.length} gif${list.length === 1 ? "" : "s"}`;
    list.forEach(name => {
    const url = gifUrl(name);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <img src="${url}" loading="lazy" alt="${name}">
        <div class="name">${displayName(name)}</div>
        `;
    card.addEventListener("click", () => {
        navigator.clipboard.writeText(url);
        showToast(`Copied "${displayName(name)}"!`);
    });
    grid.appendChild(card);
    });
}
const tagFilter = document.getElementById("tagFilter");

function renderTagFilters() {
  const allTags = [...new Set(Object.values(TAGS).flat())].sort();
  tagFilter.innerHTML = `<option value="">All tags</option>`;
  allTags.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    tagFilter.appendChild(opt);
  });
}

function applyFilters() {
    const q = search.value.toLowerCase();
    const filtered = allGifs.filter(name => {
        const matchesSearch = displayName(name).toLowerCase().includes(q);
        const matchesTag = !tagFilter.value || getTags(name).includes(tagFilter.value);
        return matchesSearch && matchesTag;
    });
    render(filtered);
}
search.addEventListener("input", applyFilters);
tagFilter.addEventListener("change", applyFilters);

Promise.all([
fetch(apiUrl).then(res => {
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
}),
fetch("gif-tags.json").then(res => res.ok ? res.json() : {})
])
.then(([data, tagsData]) => {
    TAGS = tagsData;
    allGifs = data
    .filter(item => item.type === "file" && item.name.toLowerCase().endsWith(".gif"))
    .map(item => item.name)
    .sort();
    render(allGifs);
    renderTagFilters();
})
.catch(err => {
    status.textContent = "Couldn't load gifs — check the console for details.";
    console.error(err);
});z