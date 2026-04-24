const nodeInput = document.getElementById("node-input");
const apiUrlInput = document.getElementById("api-url");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const responseBox = document.getElementById("response-box");
const structuredResponse = document.getElementById("structured-response");

apiUrlInput.value = "http://localhost:3000";

function parseInputToArray(text) {
  return text
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

async function submitData() {
  const baseUrl = apiUrlInput.value.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    statusEl.textContent = "Please enter API base URL.";
    statusEl.style.color = "#f87171";
    return;
  }

  const data = parseInputToArray(nodeInput.value);
  submitBtn.disabled = true;
  statusEl.textContent = "Submitting request...";
  statusEl.style.color = "#facc15";

  try {
    const response = await fetch(`${baseUrl}/bfhl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "API request failed");
    }

    renderStructuredResponse(payload);
    responseBox.textContent = JSON.stringify(payload, null, 2);
    statusEl.textContent = "Success";
    statusEl.style.color = "#4ade80";
  } catch (error) {
    structuredResponse.innerHTML = "";
    statusEl.textContent = `Error: ${error.message}`;
    statusEl.style.color = "#f87171";
  } finally {
    submitBtn.disabled = false;
  }
}

function renderStructuredResponse(payload) {
  const summary = payload.summary || {};
  const hierarchyCount = Array.isArray(payload.hierarchies)
    ? payload.hierarchies.length
    : 0;
  const invalidCount = Array.isArray(payload.invalid_entries)
    ? payload.invalid_entries.length
    : 0;
  const duplicateCount = Array.isArray(payload.duplicate_edges)
    ? payload.duplicate_edges.length
    : 0;

  const hierarchyHtml = renderHierarchies(payload.hierarchies || []);
  const invalidHtml = renderList(payload.invalid_entries || [], "No invalid entries");
  const duplicateHtml = renderList(payload.duplicate_edges || [], "No duplicate edges");

  structuredResponse.innerHTML = `
    <div class="response-grid">
      <div class="mini-card">
        <h3>Identity</h3>
        <p><strong>user_id:</strong> ${payload.user_id || "-"}</p>
        <p><strong>email_id:</strong> ${payload.email_id || "-"}</p>
        <p><strong>roll:</strong> ${payload.college_roll_number || "-"}</p>
      </div>
      <div class="mini-card">
        <h3>Summary</h3>
        <p><strong>total_trees:</strong> ${summary.total_trees ?? 0}</p>
        <p><strong>total_cycles:</strong> ${summary.total_cycles ?? 0}</p>
        <p><strong>largest_tree_root:</strong> ${summary.largest_tree_root ?? ""}</p>
      </div>
      <div class="mini-card">
        <h3>Counts</h3>
        <p><strong>hierarchies:</strong> ${hierarchyCount}</p>
        <p><strong>invalid_entries:</strong> ${invalidCount}</p>
        <p><strong>duplicate_edges:</strong> ${duplicateCount}</p>
      </div>
    </div>
    <div class="response-grid tree-section">
      <div class="mini-card wide-card">
        <h3>Hierarchy Trees</h3>
        ${hierarchyHtml}
      </div>
      <div class="mini-card">
        <h3>Invalid Entries</h3>
        ${invalidHtml}
      </div>
      <div class="mini-card">
        <h3>Duplicate Edges</h3>
        ${duplicateHtml}
      </div>
    </div>
  `;
}

function renderList(items, emptyMessage) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p class="muted">${emptyMessage}</p>`;
  }

  return `
    <ul class="simple-list">
      ${items.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function renderHierarchies(hierarchies) {
  if (!Array.isArray(hierarchies) || hierarchies.length === 0) {
    return `<p class="muted">No hierarchies returned.</p>`;
  }

  return hierarchies
    .map((hierarchy) => {
      if (hierarchy.has_cycle) {
        return `
          <div class="tree-card">
            <div class="tree-header">
              <span>Root: <strong>${hierarchy.root}</strong></span>
              <span class="cycle-badge">Cycle Detected</span>
            </div>
            <p class="muted">Tree visualization omitted because this group is cyclic.</p>
          </div>
        `;
      }

      const rootNode = hierarchy.root;
      const rootChildren = (hierarchy.tree && hierarchy.tree[rootNode]) || {};
      const treeMarkup = `
        <ul class="tree-root">
          ${renderTreeNode(rootNode, rootChildren)}
        </ul>
      `;

      return `
        <div class="tree-card">
          <div class="tree-header">
            <span>Root: <strong>${hierarchy.root}</strong></span>
            <span class="depth-badge">Depth ${hierarchy.depth ?? "-"}</span>
          </div>
          <div class="tree-wrap">
            ${treeMarkup}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTreeNode(label, childrenMap) {
  const children = Object.entries(childrenMap || {});
  if (children.length === 0) {
    return `<li><span class="tree-node">${label}</span></li>`;
  }

  return `
    <li>
      <span class="tree-node">${label}</span>
      <ul>
        ${children
          .map(([childLabel, childChildren]) => renderTreeNode(childLabel, childChildren))
          .join("")}
      </ul>
    </li>
  `;
}

submitBtn.addEventListener("click", submitData);
