// ===== SETUP =====
const titleInput = document.querySelector("#titleInput");
const urlInput = document.querySelector("#urlInput");
const categorySelect = document.querySelector("#categorySelect");
const addBtn = document.querySelector("#addBtn");
const searchInput = document.querySelector("#searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const bookmarkList = document.querySelector("#bookmarkList");
const emptyState = document.querySelector("#emptyState");
const totalCountEl = document.querySelector("#totalCount");
const showingCountEl = document.querySelector("#showingCount");
const categoryCountEl = document.querySelector("#categoryCount");

// ===== STATE =====
let bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
let currentFilter = "all";
let currentSearch = "";

// ===== SAVE =====
function save() {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
}

// ===== URL HELPERS =====

// Add https:// if missing
function normalizeUrl(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;   // already has protocol
    return `https://${url}`;
}

// Validate URL
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Extract domain (for favicon)
function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return "";
    }
}

// Get favicon from Google's public service
function getFavicon(url) {
    const domain = getDomain(url);
    if (!domain) return "";
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// ===== ACTIONS =====
function addBookmark() {
    const title = titleInput.value.trim();
    let url = urlInput.value.trim();
    const category = categorySelect.value;

    if (!title) {
        alert("Please enter a title");
        titleInput.focus();
        return;
    }
    if (!url) {
        alert("Please enter a URL");
        urlInput.focus();
        return;
    }

    // Normalize + validate URL
    url = normalizeUrl(url);
    if (!isValidUrl(url)) {
        alert("Please enter a valid URL (e.g., youtube.com)");
        urlInput.focus();
        return;
    }

    bookmarks.unshift({   // newest first
        id: Date.now(),
        title,
        url,
        category,
        addedAt: Date.now()
    });

    titleInput.value = "";
    urlInput.value = "";
    categorySelect.value = "other";
    titleInput.focus();

    save();
    render();
}

function deleteBookmark(id) {
    const bm = bookmarks.find(b => b.id === id);
    if (!bm) return;
    if (!confirm(`Delete "${bm.title}"?`)) return;

    bookmarks = bookmarks.filter(b => b.id !== id);
    save();
    render();
}

function copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        // Simple feedback — could be a toast notification
        alert(`Copied: ${url}`);
    }).catch(() => {
        alert("Failed to copy");
    });
}

function openBookmark(url) {
    window.open(url, "_blank");
}

// ===== FILTERING =====
function getFilteredBookmarks() {
    let filtered = bookmarks;

    // Filter by category
    if (currentFilter !== "all") {
        filtered = filtered.filter(b => b.category === currentFilter);
    }

    // Filter by search
    if (currentSearch) {
        const q = currentSearch.toLowerCase();
        filtered = filtered.filter(b =>
            b.title.toLowerCase().includes(q) ||
            b.url.toLowerCase().includes(q)
        );
    }

    return filtered;
}

// ===== RENDER =====
function render() {
    const filtered = getFilteredBookmarks();

    // Show/hide empty state
    emptyState.classList.toggle("hidden", bookmarks.length > 0);

    // Clear list
    bookmarkList.innerHTML = "";

    // Render each bookmark
    filtered.forEach(bm => {
        const li = document.createElement("li");

        // Favicon
        const favicon = document.createElement("img");
        favicon.className = "favicon";
        favicon.src = getFavicon(bm.url);
        favicon.alt = "";
        favicon.onerror = () => { favicon.style.background = "#ccc"; };

        // Info (title + url)
        const info = document.createElement("div");
        info.className = "bm-info";
        info.title = "Click to open in new tab";
        info.addEventListener("click", () => openBookmark(bm.url));

        const title = document.createElement("p");
        title.className = "bm-title";
        title.textContent = bm.title;

        const url = document.createElement("p");
        url.className = "bm-url";
        url.textContent = bm.url;

        info.appendChild(title);
        info.appendChild(url);

        // Category badge
        const category = document.createElement("span");
        category.className = `bm-category ${bm.category}`;
        category.textContent = bm.category;

        // Actions
        const actions = document.createElement("div");
        actions.className = "bm-actions";

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.textContent = "Copy";
        copyBtn.title = "Copy URL";
        copyBtn.addEventListener("click", () => copyUrl(bm.url));

        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.textContent = "Delete";
        delBtn.title = "Remove bookmark";
        delBtn.addEventListener("click", () => deleteBookmark(bm.id));

        actions.appendChild(copyBtn);
        actions.appendChild(delBtn);

        // Assemble
        li.appendChild(favicon);
        li.appendChild(info);
        li.appendChild(category);
        li.appendChild(actions);
        bookmarkList.appendChild(li);
    });

    // Update stats
    totalCountEl.textContent = bookmarks.length;
    showingCountEl.textContent = filtered.length;
    const uniqueCategories = new Set(bookmarks.map(b => b.category));
    categoryCountEl.textContent = uniqueCategories.size;
}

// ===== EVENTS =====
addBtn.addEventListener("click", addBookmark);

// Enter in title → next field
titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") urlInput.focus();
});

// Enter in URL → add bookmark
urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addBookmark();
});

// Search
searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    render();
});

// Filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        currentFilter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.toggle("active", b === btn));
        render();
    });
});

// ===== START =====
render();