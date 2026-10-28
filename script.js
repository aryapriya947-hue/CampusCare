
const STORAGE_KEY = "campuscare_issues_v1";

const form = document.getElementById("issueForm");
const issueList = document.getElementById("issueList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const categoryFilter = document.getElementById("categoryFilter");
const message = document.getElementById("message");

function loadIssues() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(data)) return [];

    return data.filter(issue =>
      issue &&
      typeof issue.id === "string" &&
      typeof issue.title === "string" &&
      typeof issue.category === "string" &&
      typeof issue.location === "string" &&
      typeof issue.description === "string" &&
      ["Low", "Medium", "High"].includes(issue.priority) &&
      ["Open", "In Progress", "Resolved"].includes(issue.status)
    );
  } catch (error) {
    console.error("Unable to load reports:", error);
    return [];
  }
}

let issues = loadIssues();

function saveIssues() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    return true;
  } catch (error) {
    console.error("Unable to save reports:", error);
    message.textContent = "Unable to save reports. Check browser storage.";
    message.style.color = "#c34e5c";
    return false;
  }
}

function updateStats() {
  document.getElementById("totalCount").textContent = issues.length;
  document.getElementById("openCount").textContent =
    issues.filter(i => i.status === "Open").length;
  document.getElementById("progressCount").textContent =
    issues.filter(i => i.status === "In Progress").length;
  document.getElementById("resolvedCount").textContent =
    issues.filter(i => i.status === "Resolved").length;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createIssueCard(issue) {
  const card = el("article", "issue-card");
  const top = el("div", "issue-top");
  const heading = document.createElement("div");

  heading.append(
    el("h3", "", issue.title),
    el("p", "", `${issue.category} · ${issue.location}`)
  );

  const statusClass = {
    "Open": "status-open",
    "In Progress": "status-progress",
    "Resolved": "status-resolved"
  }[issue.status];

  top.append(
    heading,
    el("span", `pill ${statusClass}`, issue.status)
  );

  card.append(
    top,
    el("span", "pill priority", `${issue.priority} priority`),
    el("p", "issue-description", issue.description)
  );

  const date = new Date(issue.createdAt);

  card.append(
    el(
      "p",
      "",
      `Reported: ${
        Number.isNaN(date.getTime())
          ? "Date unavailable"
          : date.toLocaleDateString()
      }`
    )
  );

  const actions = el("div", "issue-actions");

  if (issue.status !== "Resolved") {
    const updateButton = el(
      "button",
      "small-btn",
      issue.status === "Open" ? "Start progress →" : "✓ Mark resolved"
    );

    updateButton.type = "button";

    updateButton.addEventListener("click", () => {
      const index = issues.findIndex(i => i.id === issue.id);
      if (index === -1) return;

      const oldStatus = issues[index].status;

      issues[index].status =
        oldStatus === "Open" ? "In Progress" : "Resolved";

      if (!saveIssues()) {
        issues[index].status = oldStatus;
        return;
      }

      message.textContent = "Issue status updated.";
      message.style.color = "#218558";
      renderIssues();
    });

    actions.append(updateButton);
  }

  const deleteButton = el("button", "small-btn delete-btn", "Delete");
  deleteButton.type = "button";

  deleteButton.addEventListener("click", () => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    const previous = issues;
    issues = issues.filter(i => i.id !== issue.id);

    if (!saveIssues()) {
      issues = previous;
      return;
    }

    message.textContent = "Report deleted.";
    message.style.color = "#218558";
    renderIssues();
  });

  actions.append(deleteButton);
  card.append(actions);

  return card;
}

function renderIssues() {
  issueList.replaceChildren();

  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedCategory = categoryFilter.value;

  const filtered = issues.filter(issue => {
    const text = [
      issue.title,
      issue.location,
      issue.description,
      issue.category
    ].join(" ").toLowerCase();

    return (
      text.includes(query) &&
      (selectedStatus === "All" || issue.status === selectedStatus) &&
      (selectedCategory === "All" || issue.category === selectedCategory)
    );
  });

  document.getElementById("visibleCount").textContent =
    `${filtered.length} ${filtered.length === 1 ? "report" : "reports"}`;

  if (filtered.length === 0) {
    issueList.append(
      el(
        "div",
        "empty",
        issues.length === 0
          ? "✦ Your campus story starts here. Submit the first report!"
          : "No matching issues. Try changing your search or filters."
      )
    );
  } else {
    filtered.forEach(issue => {
      issueList.append(createIssueCard(issue));
    });
  }

  updateStats();
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const location = document.getElementById("location").value.trim();
  const priority = document.getElementById("priority").value;
  const description = document.getElementById("description").value.trim();

  if (!title || !category || !location || !description) {
    message.textContent = "Please complete all required fields.";
    message.style.color = "#c34e5c";
    return;
  }

  if (!["Low", "Medium", "High"].includes(priority)) return;

  const newIssue = {
    id: crypto.randomUUID(),
    title,
    category,
    location,
    priority,
    description,
    status: "Open",
    createdAt: new Date().toISOString()
  };

  issues.unshift(newIssue);

  if (!saveIssues()) {
    issues.shift();
    return;
  }

  form.reset();
  searchInput.value = "";
  statusFilter.value = "All";
  categoryFilter.value = "All";

  message.textContent = "✓ Report submitted successfully. Thank you!";
  message.style.color = "#218558";

  renderIssues();
});

searchInput.addEventListener("input", renderIssues);
statusFilter.addEventListener("change", renderIssues);
categoryFilter.addEventListener("change", renderIssues);

renderIssues();
