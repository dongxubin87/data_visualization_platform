
class TreeRenderer {
  constructor(svg, zoom) {
    this.svg = svg;
    this.zoom = zoom;
    this.root = null;
    this.currentType = 'horizontal';
    this.i = 0;
  }

  render(treeData, type, container) {
    if (!treeData) {
      console.log('No tree data to render');
      return;
    }

    this.currentType = type;
    this.svg.selectAll('*').remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    console.log('Rendering tree:', type, 'Container size:', width, 'x', height);

    // Create hierarchy and sort
    const root = d3.hierarchy(treeData);

    root.sort((a, b) => d3.ascending(a.data.name, b.data.name));

    if (type === 'radial') {
      const radius = Math.min(width, height) / 2 - 30;
      const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

      tree(root);

      const g = this.svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      g.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#555')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y));

      const node = g.append('g')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-width', 3)
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90})translate(${d.y},0)`);

      node.append('circle')
        .attr('r', 2.5)
        .attr('fill', d => d.children ? '#555' : '#999');

      node.append('text')
        .attr('dy', '0.5em')
        .attr('x', d => d.children ? -6 : 6)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name)
        .attr('stroke', 'white')
        .attr('paint-order', 'stroke');

      this.svg
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

      this.svg.call(this.zoom);
      return;
    }

    const dx = 20;
    const dy = 200;
    const tree = d3.tree().nodeSize([dx, dy]);

    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

    root.children.forEach(this.collapse.bind(this));

    tree(root);

    let x0 = Infinity;
    let x1 = -x0;
    let y0 = Infinity;
    let y1 = -y0;

    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
      if (d.y > y1) y1 = d.y;
      if (d.y < y0) y0 = d.y;
    });

    const treeWidth = y1 - y0;
    const treeHeight = x1 - x0;
    const leftMargin = 50;
    const offsetX = leftMargin - y0;
    const offsetY = (height - treeHeight) / 2 - x0;

    const g = this.svg.append('g')
      .attr('transform', `translate(${offsetX},${offsetY})`);

    this.svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'font: 12px sans-serif; user-select: none;');

    this.svg.call(
      d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
          g.attr('transform', `translate(${offsetX},${offsetY}) ${event.transform}`);
        })
    );

    this.root = root;
    this.tree = tree;
    this.diagonal = diagonal;
    this.g = g;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.update(root, root);
  }

  collapse(d) {
    if (d.children) {
      // d._children = d.children;
      // d._children.forEach(this.collapse.bind(this));
      // d.children = null;
    }
  }

  update(source, root) {
    this.tree(root);


    const nodes = root.descendants();
    const links = root.links();

    const node = this.g.selectAll('g.node')
      .data(nodes, d => d.id || (d.id = ++this.i));

    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${source.y0},${source.x0})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        this.update(d, this.root);
      });

    nodeEnter.append('circle')
      .attr('r', 4)
      .attr('fill', d => d._children ? '#555' : '#999');

    nodeEnter.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.depth === 0 ? -6 : (d._children ? -6 : 6))
      .attr('text-anchor', d => d.depth === 0 ? 'end' : (d._children ? 'end' : 'start'))
      .text(d => d.data.name);

    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition().duration(200)
      .attr('transform', d => `translate(${d.y},${d.x})`);

    nodeUpdate.select('circle')
      .attr('fill', d => d._children ? '#555' : '#999');

    const nodeExit = node.exit().transition().duration(200)
      .attr('transform', d => `translate(${source.y},${source.x})`)
      .remove();

    nodeExit.select('circle').attr('r', 1e-6);
    nodeExit.select('text').style('fill-opacity', 1e-6);

    const link = this.g.selectAll('path.link')
      .data(links, d => d.target.id);

    const linkEnter = link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .attr('d', d => {
        const o = { x: source.x0, y: source.y0 };
        return this.diagonal({ source: o, target: o });
      });

    linkEnter.merge(link).transition().duration(200)
      .attr('d', this.diagonal);

    link.exit().transition().duration(200)
      .attr('d', d => {
        const o = { x: source.x, y: source.y };
        return this.diagonal({ source: o, target: o });
      })
      .remove();

    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }
}