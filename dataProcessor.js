
class DataProcessor {
  constructor() {
    this.currentData = null;
    this.treeData = null;
    this.graphData = null;
  }

  async processFile(file) {
    try {
      const text = await file.text();
      let data;

      if (file.name.endsWith('.csv')) {
        const raw = d3.dsvFormat(";").parse(text, d3.autoType);

        if (!raw || raw.length === 0) {
          return { success: false, error: "Empty CSV" };
        }

        this.currentData = raw;

        if ("path" in raw[0]) {
          this.treeData = this.buildTreeFromCSVPath(raw);
        } else if ("parent_item" in raw[0] && "child_item" in raw[0]) {
          this.treeData = this.buildTreeFromParentChild(raw);
        } else {
          throw new Error("Unsupported CSV structure");
        }

        this.graphData = this.buildGraphFromTree(this.treeData);
        return { success: true, data: raw };

      } else if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
        this.currentData = data;
        this.treeData = this.buildTreeFromJSON(data);
        this.graphData = this.buildGraphFromJSON(data);
        return { success: true, data };
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  buildTreeFromCSVPath(raw) {
    const rootId = String(raw[0].eng_id).trim();
    const rootObj = { name: rootId, children: [] };

    function insertPath(parts) {
      let node = rootObj;
      for (let i = 1; i < parts.length; i++) {
        const part = String(parts[i]).trim();
        if (!part) continue;
        let child = (node.children || []).find(c => c.name === part);
        if (!child) {
          child = { name: part, children: [] };
          node.children.push(child);
        }
        node = child;
      }
    }

    raw.forEach(row => {
      const rawPath = row.path ?? "";
      const pathParts = rawPath.split("->").map(s => s && String(s).trim()).filter(Boolean);
      const fullPath = [rootId, ...pathParts];
      insertPath(fullPath);
    });

    return rootObj;
  }

  buildTreeFromParentChild(raw) {
    const nodeMap = new Map();

    raw.forEach(row => {
      const parentId = String(row.parent_item).trim();
      const childId = String(row.child_item).trim();

      if (!nodeMap.has(parentId)) {
        nodeMap.set(parentId, { name: parentId, children: [] });
      }
      if (!nodeMap.has(childId)) {
        nodeMap.set(childId, { name: childId, children: [] });
      }

      nodeMap.get(parentId).children.push(nodeMap.get(childId));
    });

    const allChildren = new Set(raw.map(row => String(row.child_item).trim()));
    let root = null;
    for (const row of raw) {
      const parentId = String(row.parent_item).trim();
      if (!allChildren.has(parentId)) {
        root = nodeMap.get(parentId);
        break;
      }
    }

    return root || { name: "Root", children: Array.from(nodeMap.values()) };
  }


  buildGraphFromTree(tree) {
    const nodeMap = new Map();
    const links = [];

    function traverse(node, parentId = null) {
      const nodeId = node.name;

      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, { id: nodeId, name: node.name, data: node });
      }

      if (parentId) {
        links.push({ source: parentId, target: nodeId });
      }

      if (node.children) {
        node.children.forEach(child => traverse(child, nodeId));
      }
    }

    traverse(tree);

    return {
      nodes: Array.from(nodeMap.values()),
      links
    };
  }

  buildTreeFromJSON(data = this.currentData) {
    if (data.children) {
      return data;
    } else if (Array.isArray(data)) {
      return { name: 'Root', children: data };
    } else {
      return { name: 'Root', children: [data] };
    }
  }

  buildGraphFromJSON(data = this.currentData) {
    if (data.nodes && data.links) {
      return data;
    } else if (data.children) {
      return this.buildGraphFromTree(data);
    } else {
      return { nodes: [{ id: 'root', name: 'Root' }], links: [] };
    }
  }
}