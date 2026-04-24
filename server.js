const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

const PORT = process.env.PORT || 3000;
const VALID_EDGE_REGEX = /^[A-Z]->[A-Z]$/;
const USER_ID = process.env.USER_ID || "ayushpandey_15032005";
const EMAIL_ID = process.env.EMAIL_ID || "ap8132@srmist.edu.in";
const COLLEGE_ROLL_NUMBER =
  process.env.COLLEGE_ROLL_NUMBER || "RA2311003010604";

function collectComponent(startNode, undirectedAdj, seen) {
  const stack = [startNode];
  const component = [];
  seen.add(startNode);

  while (stack.length > 0) {
    const current = stack.pop();
    component.push(current);
    for (const neighbor of undirectedAdj.get(current) || []) {
      if (!seen.has(neighbor)) {
        seen.add(neighbor);
        stack.push(neighbor);
      }
    }
  }

  component.sort();
  return component;
}

function detectCycle(root, directedAdj, componentSet) {
  const visiting = new Set();
  const visited = new Set();

  function dfs(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;

    visiting.add(node);
    for (const child of directedAdj.get(node) || []) {
      if (!componentSet.has(child)) continue;
      if (dfs(child)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }

  return dfs(root);
}

function buildTreeAndDepth(root, directedAdj, componentSet) {
  function buildNode(node) {
    const childObj = {};
    let maxDepthFromChildren = 0;

    for (const child of directedAdj.get(node) || []) {
      if (!componentSet.has(child)) continue;
      const built = buildNode(child);
      childObj[child] = built.treeForNode;
      maxDepthFromChildren = Math.max(maxDepthFromChildren, built.depth);
    }

    return {
      treeForNode: childObj,
      depth: maxDepthFromChildren + 1,
    };
  }

  const builtRoot = buildNode(root);
  return {
    tree: { [root]: builtRoot.treeForNode },
    depth: builtRoot.depth,
  };
}

app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body || {};
    if (!Array.isArray(data)) {
      return res.status(400).json({
        error: "Invalid payload. Expected: { data: string[] }",
      });
    }

    const invalid_entries = [];
    const duplicate_edges = [];
    const duplicateSet = new Set();
    const seenEdges = new Set();
    const uniqueEdges = [];
    const childToParent = new Map();

    for (const rawEntry of data) {
      const entry = typeof rawEntry === "string" ? rawEntry.trim() : "";

      if (!VALID_EDGE_REGEX.test(entry)) {
        invalid_entries.push(entry);
        continue;
      }

      const [parent, child] = entry.split("->");
      if (parent === child) {
        invalid_entries.push(entry);
        continue;
      }

      if (seenEdges.has(entry)) {
        if (!duplicateSet.has(entry)) {
          duplicateSet.add(entry);
          duplicate_edges.push(entry);
        }
        continue;
      }
      seenEdges.add(entry);

      // Diamond/multi-parent rule: first parent wins for the same child.
      if (childToParent.has(child)) {
        continue;
      }
      childToParent.set(child, parent);
      uniqueEdges.push([parent, child]);
    }

    const directedAdj = new Map();
    const undirectedAdj = new Map();
    const nodes = new Set();
    const childNodes = new Set();

    function ensure(map, key) {
      if (!map.has(key)) map.set(key, []);
      return map.get(key);
    }

    for (const [parent, child] of uniqueEdges) {
      ensure(directedAdj, parent).push(child);
      ensure(directedAdj, child);

      ensure(undirectedAdj, parent).push(child);
      ensure(undirectedAdj, child).push(parent);

      nodes.add(parent);
      nodes.add(child);
      childNodes.add(child);
    }

    const components = [];
    const seenComponent = new Set();
    const sortedNodes = [...nodes].sort();
    for (const node of sortedNodes) {
      if (!seenComponent.has(node)) {
        components.push(collectComponent(node, undirectedAdj, seenComponent));
      }
    }

    const hierarchies = [];
    for (const component of components) {
      const componentSet = new Set(component);
      const roots = component.filter((node) => !childNodes.has(node));
      const root = roots.length > 0 ? roots[0] : component[0];

      const hasCycle = detectCycle(root, directedAdj, componentSet);
      if (hasCycle) {
        hierarchies.push({
          root,
          tree: {},
          has_cycle: true,
        });
      } else {
        const built = buildTreeAndDepth(root, directedAdj, componentSet);
        hierarchies.push({
          root,
          tree: built.tree,
          depth: built.depth,
        });
      }
    }

    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = "";
    let largestDepth = 0;

    for (const hierarchy of hierarchies) {
      if (hierarchy.has_cycle) {
        total_cycles += 1;
        continue;
      }

      total_trees += 1;
      if (
        hierarchy.depth > largestDepth ||
        (hierarchy.depth === largestDepth &&
          (largest_tree_root === "" || hierarchy.root < largest_tree_root))
      ) {
        largestDepth = hierarchy.depth;
        largest_tree_root = hierarchy.root;
      }
    }

    return res.json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL_NUMBER,
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/health", (_, res) => {
  res.json({ status: "ok", service: "bfhl" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});