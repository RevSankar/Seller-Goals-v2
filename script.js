// --- Data Model ---
function getNowISO() { return new Date().toISOString(); }
function getUser() { return "Current Seller"; } // Replace with real user if needed

function loadGoals() {
  return JSON.parse(localStorage.getItem("goals") || "[]");
}
function saveGoals(goals) {
  localStorage.setItem("goals", JSON.stringify(goals));
}

// --- UI State ---
let editingGoalId = null;

// --- DOM Elements ---
const navGoals = document.getElementById("nav-goals");
const navDashboard = document.getElementById("nav-dashboard");
const navGantt = document.getElementById("nav-gantt");
const goalFormSection = document.getElementById("goalFormSection");
const goalListSection = document.getElementById("goalListSection");
const dashboardSection = document.getElementById("dashboardSection");
const ganttSection = document.getElementById("ganttSection");
const goalForm = document.getElementById("goalForm");
const formTitle = document.getElementById("formTitle");
const saveGoalBtn = document.getElementById("saveGoalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const goalListDiv = document.getElementById("goalList");
const dashboardCards = document.getElementById("dashboardCards");

// --- Navigation ---
function showSection(section) {
  [goalFormSection, goalListSection, dashboardSection, ganttSection].forEach(s => s.classList.remove("active"));
  [navGoals, navDashboard, navGantt].forEach(b => b.classList.remove("active"));
  if (section === "goals") {
    goalFormSection.classList.add("active");
    goalListSection.classList.add("active");
    navGoals.classList.add("active");
  } else if (section === "dashboard") {
    dashboardSection.classList.add("active");
    navDashboard.classList.add("active");
    renderDashboard();
  } else if (section === "gantt") {
    ganttSection.classList.add("active");
    navGantt.classList.add("active");
    renderGantt();
  }
}
navGoals.onclick = () => showSection("goals");
navDashboard.onclick = () => showSection("dashboard");
navGantt.onclick = () => showSection("gantt");

// --- Form Handling ---
goalForm.onsubmit = function(e) {
  e.preventDefault();
  const goals = loadGoals();
  const goal = {
    id: editingGoalId || "goal-" + Date.now(),
    name: document.getElementById("goalName").value.trim(),
    description: document.getElementById("goalDescription").value.trim(),
    startDate: document.getElementById("goalStartDate").value,
    targetDate: document.getElementById("goalTargetDate").value,
    confidence: parseInt(document.getElementById("goalConfidence").value, 10) || 0,
    barriers: document.getElementById("goalBarriers").value.trim(),
    comments: document.getElementById("goalComments").value.trim(),
    owner: document.getElementById("goalOwner").value.trim(),
    shortTerms: document.getElementById("goalShortTerms").value.split(",").map(s => s.trim()).filter(Boolean),
    progress: parseInt(document.getElementById("goalProgress").value, 10) || 0,
    revenue: parseFloat(document.getElementById("goalRevenue").value) || 0,
    createdDate: editingGoalId ? goals.find(g => g.id === editingGoalId).createdDate : getNowISO(),
    updatedDate: getNowISO(),
    createdBy: editingGoalId ? goals.find(g => g.id === editingGoalId).createdBy : getUser(),
    updatedBy: getUser()
  };
  if (editingGoalId) {
    const idx = goals.findIndex(g => g.id === editingGoalId);
    goals[idx] = goal;
  } else {
    goals.push(goal);
  }
  saveGoals(goals);
  resetForm();
  renderGoalList();
};

function resetForm() {
  goalForm.reset();
  editingGoalId = null;
  formTitle.textContent = "Add New Goal";
  saveGoalBtn.textContent = "Add Goal";
  cancelEditBtn.style.display = "none";
}
cancelEditBtn.onclick = resetForm;

// --- Render Goal List ---



function renderGoalList() {
  const goals = loadGoals();
  goals.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
  if (!goals.length) {
    goalListDiv.innerHTML = "<p>No goals yet. Add one above!</p>";
    return;
  }
  let html = '<div class="goals-grid">';
  for (const goal of goals) {
    html += `
      <div class="goal-card">
        <div class="goal-card-header">
          ${goal.name || ''}
          <span class="badge owner">${goal.owner || ''}</span>
          <span class="badge confidence">${goal.confidence != null ? goal.confidence + '%' : ''} Confidence</span>
        </div>
        <div class="goal-details-grid">
          <div><b>Start:</b> ${goal.startDate || ''}</div>
          <div><b>Target:</b> ${goal.targetDate || ''}</div>
          <div><b>Revenue:</b> $${goal.revenue != null ? goal.revenue.toLocaleString() : ''}</div>
          <div><b>Barriers:</b> ${goal.barriers || ''}</div>
          <div><b>Comments:</b> ${goal.comments || ''}</div>
          <div><b>Short Terms:</b> ${goal.shortTerms && goal.shortTerms.length ? goal.shortTerms.map(st => `<span class=\"badge\">${st}</span>`).join(' ') : ''}</div>
          <div><b>Progress:</b> <span class=\"badge progress\">${goal.progress != null ? goal.progress + '%' : ''}</span></div>
          <div><b>Description:</b> ${goal.description || ''}</div>
          <div><b>Created:</b> ${goal.createdDate ? new Date(goal.createdDate).toLocaleString() : ''}</div>
          <div><b>Updated:</b> ${goal.updatedDate ? new Date(goal.updatedDate).toLocaleString() : ''}</div>
          <div><b>Created By:</b> ${goal.createdBy || ''}</div>
          <div><b>Updated By:</b> ${goal.updatedBy || ''}</div>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${goal.progress || 0}%"></div>
        </div>
        <div class="goal-card-actions">
          <button class="edit-goal" data-id="${goal.id}">Edit</button>
          <button class="delete-goal" data-id="${goal.id}" style="background:#c00;">Delete</button>
        </div>
      </div>
    `;
  }
  html += '</div>';
  goalListDiv.innerHTML = html;
  document.querySelectorAll(".edit-goal").forEach(btn => {
    btn.onclick = () => editGoal(btn.dataset.id);
  });
  document.querySelectorAll(".delete-goal").forEach(btn => {
    btn.onclick = () => deleteGoal(btn.dataset.id);
  });
}

function renderGoalRow(goal, isNested = false) {
  let row = `<tr${isNested ? ' class="nested-goal-row"' : ""}>
    <td>${goal.name}</td>
    <td>${goal.description}</td>
    <td>${goal.startDate}</td>
    <td>${goal.targetDate}</td>
    <td>${goal.confidence}%</td>
    <td>${goal.progress}%</td>
    <td>$${goal.revenue.toLocaleString()}</td>
    <td>${goal.owner}</td>
    <td>${goal.shortTerms && goal.shortTerms.length ? goal.shortTerms.map(st => `<span>${st}</span>`).join(", ") : ""}</td>
    <td>${goal.createdDate ? goal.createdDate.split("T")[0] : ""}</td>
    <td>${goal.updatedDate ? goal.updatedDate.split("T")[0] : ""}</td>
    <td>
      <button class="edit-goal" data-id="${goal.id}">Edit</button>
      <button class="delete-goal" data-id="${goal.id}" style="background:#c00;">Delete</button>
    </td>
  </tr>`;
  // Render nested short-term goals as rows
  if (goal.shortTerms && goal.shortTerms.length) {
    row += `<tr><td colspan="12" class="nested-goals"><b>Short Term Goals:</b> ${goal.shortTerms.map(st => `<span>${st}</span>`).join(", ")}</td></tr>`;
  }
  return row;
}

function editGoal(id) {
  const goals = loadGoals();
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  editingGoalId = id;
  formTitle.textContent = "Edit Goal";
  saveGoalBtn.textContent = "Save Changes";
  cancelEditBtn.style.display = "inline-block";
  document.getElementById("goalName").value = goal.name;
  document.getElementById("goalDescription").value = goal.description;
  document.getElementById("goalStartDate").value = goal.startDate;
  document.getElementById("goalTargetDate").value = goal.targetDate;
  document.getElementById("goalConfidence").value = goal.confidence;
  document.getElementById("goalBarriers").value = goal.barriers;
  document.getElementById("goalComments").value = goal.comments;
  document.getElementById("goalOwner").value = goal.owner;
  document.getElementById("goalShortTerms").value = goal.shortTerms ? goal.shortTerms.join(", ") : "";
  document.getElementById("goalProgress").value = goal.progress;
  document.getElementById("goalRevenue").value = goal.revenue;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteGoal(id) {
  if (!confirm("Delete this goal?")) return;
  let goals = loadGoals();
  goals = goals.filter(g => g.id !== id);
  saveGoals(goals);
  renderGoalList();
}

// --- Dashboard ---

function renderDashboard() {
  const goals = loadGoals();
  if (!goals.length) {
    dashboardCards.innerHTML = "<p>No goals to show.</p>";
    return;
  }
  // Only count goals with valid progress/confidence/revenue for averages
  const validProgressGoals = goals.filter(g => typeof g.progress === 'number' && !isNaN(g.progress));
  const validConfidenceGoals = goals.filter(g => typeof g.confidence === 'number' && !isNaN(g.confidence));
  const validRevenueGoals = goals.filter(g => typeof g.revenue === 'number' && !isNaN(g.revenue));
  const total = goals.length;
  const completed = goals.filter(g => g.progress >= 100).length;
  const avgProgress = validProgressGoals.length ? Math.round(validProgressGoals.reduce((sum, g) => sum + g.progress, 0) / validProgressGoals.length) : 0;
  const totalRevenue = validRevenueGoals.reduce((sum, g) => sum + g.revenue, 0);
  const avgConfidence = validConfidenceGoals.length ? Math.round(validConfidenceGoals.reduce((sum, g) => sum + g.confidence, 0) / validConfidenceGoals.length) : 0;
  dashboardCards.innerHTML = `
    <div class="dashboard-section">
      <div class="dashboard-cards">
        <div class="dashboard-card">
          <span class="dash-icon">📋</span>
          <span class="dash-value">${total}</span>
          <span class="dash-label">Total Goals</span>
        </div>
        <div class="dashboard-card">
          <span class="dash-icon">✅</span>
          <span class="dash-value">${completed}</span>
          <span class="dash-label">Completed Goals</span>
        </div>
        <div class="dashboard-card">
          <span class="dash-icon">📈</span>
          <span class="dash-value">${avgProgress}%</span>
          <span class="dash-label">Avg. Progress</span>
        </div>
        <div class="dashboard-card">
          <span class="dash-icon">💰</span>
          <span class="dash-value">$${totalRevenue.toLocaleString()}</span>
          <span class="dash-label">Total Revenue</span>
        </div>
        <div class="dashboard-card">
          <span class="dash-icon">🎯</span>
          <span class="dash-value">${avgConfidence}%</span>
          <span class="dash-label">Avg. Confidence</span>
        </div>
      </div>
      <div class="dashboard-timeline">
        <h3>Goals Created Timeline</h3>
        <div id="dashboardHistogram"></div>
      </div>
    </div>
  `;
  renderDashboardHistogram(goals);
// Render a simple SVG histogram for goals created per month
function renderDashboardHistogram(goals) {
  // Remove APAC goal if present
  let filteredGoals = goals.filter(g => !(g.name && g.name.toLowerCase().includes('apac')));
  // Group by month-year
  const counts = {};
  filteredGoals.forEach(g => {
    if (!g.createdDate) return;
    const d = new Date(g.createdDate);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const sortedKeys = Object.keys(counts).sort();
  const maxCount = Math.max(...Object.values(counts), 1);
  // SVG dimensions
  const width = Math.max(320, sortedKeys.length * 60);
  const height = 140;
  const barWidth = 36;
  const barGap = 24;
  let svg = `<svg width="${width}" height="${height}">`;
  sortedKeys.forEach((key, i) => {
    const x = i * (barWidth + barGap) + 30;
    const barHeight = Math.round((counts[key] / maxCount) * 90);
    const y = height - barHeight - 30;
    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#2563eb" rx="6" />`;
    svg += `<text x="${x + barWidth/2}" y="${height-10}" text-anchor="middle" font-size="12" fill="#5c5c8a">${key}</text>`;
    svg += `<text x="${x + barWidth/2}" y="${y-6}" text-anchor="middle" font-size="13" fill="#001a35" font-weight="bold">${counts[key]}</text>`;
  });
  svg += '</svg>';
  document.getElementById('dashboardHistogram').innerHTML = svg;
}
}

// --- Gantt Chart ---

function renderGantt() {
  const goals = loadGoals();
  const ganttDiv = document.getElementById("ganttChart");
  if (!goals.length) {
    ganttDiv.innerHTML = "<p>No goals to show.</p>";
    return;
  }
  // Only show goals with valid dates
  const validGoals = goals.filter(g => g.startDate && g.targetDate);
  if (!validGoals.length) {
    ganttDiv.innerHTML = "<p>No goals with valid dates to show.</p>";
    return;
  }
  google.charts.load('current', {'packages':['gantt']});
  google.charts.setOnLoadCallback(drawGantt);

  function drawGantt() {
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Task ID');
    data.addColumn('string', 'Task Name');
    data.addColumn('string', 'Resource');
    data.addColumn('date', 'Start Date');
    data.addColumn('date', 'End Date');
    data.addColumn('number', 'Duration');
    data.addColumn('number', 'Percent Complete');
    data.addColumn('string', 'Dependencies');
    for (const goal of validGoals) {
      data.addRow([
        goal.id,
        goal.name,
        goal.owner,
        new Date(goal.startDate),
        new Date(goal.targetDate),
        null,
        goal.progress,
        null
      ]);
    }
    const chart = new google.visualization.Gantt(ganttDiv);
    chart.draw(data, {
      height: 40 * validGoals.length + 50,
      gantt: { trackHeight: 30 }
    });
  }
}


// --- Add Sample Goals if none exist ---
function addSampleGoalsIfEmpty() {
  let goals = loadGoals();
  if (goals.length === 0) {
    const now = new Date();
    const sampleGoals = [
      {
        id: 'goal-sample-1',
        name: 'Close Azure Enterprise Deal',
        description: 'Work with Contoso to close a $500K Azure deal.',
        startDate: now.toISOString().slice(0,10),
        targetDate: new Date(now.getFullYear(), now.getMonth()+2, now.getDate()).toISOString().slice(0,10),
        confidence: 80,
        barriers: 'Customer budget approval',
        comments: 'Demo scheduled for next week.',
        owner: 'Alice Smith',
        shortTerms: ['Schedule demo', 'Send proposal'],
        progress: 40,
        revenue: 500000,
        createdDate: now.toISOString(),
        updatedDate: now.toISOString(),
        createdBy: 'Alice Smith',
        updatedBy: 'Alice Smith'
      },
      {
        id: 'goal-sample-2',
        name: 'Upsell Microsoft 365',
        description: 'Increase M365 licenses for Fabrikam.',
        startDate: now.toISOString().slice(0,10),
        targetDate: new Date(now.getFullYear(), now.getMonth()+1, now.getDate()).toISOString().slice(0,10),
        confidence: 60,
        barriers: 'IT team evaluation',
        comments: 'Waiting for IT feedback.',
        owner: 'Bob Lee',
        shortTerms: ['Meet IT', 'Present value'],
        progress: 20,
        revenue: 12000,
        createdDate: now.toISOString(),
        updatedDate: now.toISOString(),
        createdBy: 'Bob Lee',
        updatedBy: 'Bob Lee'
      },
      {
        id: 'goal-sample-3',
        name: 'Renew Dynamics CRM',
        description: 'Renew CRM contract for Northwind.',
        startDate: now.toISOString().slice(0,10),
        targetDate: new Date(now.getFullYear(), now.getMonth()+3, now.getDate()).toISOString().slice(0,10),
        confidence: 90,
        barriers: 'Legal review',
        comments: 'Contract sent to legal.',
        owner: 'Carol Jones',
        shortTerms: ['Send contract', 'Follow up'],
        progress: 70,
        revenue: 30000,
        createdDate: now.toISOString(),
        updatedDate: now.toISOString(),
        createdBy: 'Carol Jones',
        updatedBy: 'Carol Jones'
      }
    ];
    saveGoals(sampleGoals);
  }
}

// Render all views on load
function renderAllViews() {
  renderGoalList();
  renderDashboard();
  renderGantt();
}

addSampleGoalsIfEmpty();
renderAllViews();

// Patch: Always re-render dashboard and Gantt after any data change
function afterDataChange() {
  renderGoalList();
  renderDashboard();
  renderGantt();
}

// Update form submission to use afterDataChange
goalForm.onsubmit = function(e) {
  e.preventDefault();
  const goals = loadGoals();
  const goal = {
    id: editingGoalId || "goal-" + Date.now(),
    name: document.getElementById("goalName").value.trim(),
    description: document.getElementById("goalDescription").value.trim(),
    startDate: document.getElementById("goalStartDate").value,
    targetDate: document.getElementById("goalTargetDate").value,
    confidence: parseInt(document.getElementById("goalConfidence").value, 10) || 0,
    barriers: document.getElementById("goalBarriers").value.trim(),
    comments: document.getElementById("goalComments").value.trim(),
    owner: document.getElementById("goalOwner").value.trim(),
    shortTerms: document.getElementById("goalShortTerms").value.split(",").map(s => s.trim()).filter(Boolean),
    progress: parseInt(document.getElementById("goalProgress").value, 10) || 0,
    revenue: parseFloat(document.getElementById("goalRevenue").value) || 0,
    createdDate: editingGoalId ? goals.find(g => g.id === editingGoalId).createdDate : getNowISO(),
    updatedDate: getNowISO(),
    createdBy: editingGoalId ? goals.find(g => g.id === editingGoalId).createdBy : getUser(),
    updatedBy: getUser()
  };
  if (editingGoalId) {
    const idx = goals.findIndex(g => g.id === editingGoalId);
    goals[idx] = goal;
  } else {
    goals.push(goal);
  }
  saveGoals(goals);
  resetForm();
  afterDataChange();
};

// Update deleteGoal to use afterDataChange
function deleteGoal(id) {
  if (!confirm("Delete this goal?")) return;
  let goals = loadGoals();
  goals = goals.filter(g => g.id !== id);
  saveGoals(goals);
  afterDataChange();
}

// Always re-render dashboard and Gantt when switching tabs
navGoals.onclick = () => {
  showSection("goals");
  renderGoalList();
};
navDashboard.onclick = () => {
  showSection("dashboard");
  renderDashboard();
};
navGantt.onclick = () => {
  showSection("gantt");
  renderGantt();
};
