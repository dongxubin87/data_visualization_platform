// graphRenderer.js
// class GraphRenderer {
//   constructor(svg, zoom) {
//     this.svg = svg;
//     this.zoom = zoom;
//     this.simulation = null;
//   }

//   render(graphData, type, container) {
//     if (!graphData) return;

//     this.svg.selectAll('*').remove();

//     const width = container.clientWidth;
//     const height = container.clientHeight;

//     this.svg.attr('viewBox', [0, 0, width, height]);

//     const g = this.svg.append('g');

//     // Color scale
//     const color = d3.scaleOrdinal(d3.schemeCategory10);

//     // Create simulation
//     const links = graphData.links.map(d => ({ ...d }));
//     const nodes = graphData.nodes.map(d => ({ ...d }));

//     let simulation;
//     const forceStrength = parseFloat(document.getElementById('forceStrength').value);

//     switch (type) {
//       case 'force':
//         simulation = d3.forceSimulation(nodes)
//           .force('link', d3.forceLink(links).id(d => d.id))
//           .force('charge', d3.forceManyBody().strength(-forceStrength * 200))
//           .force('center', d3.forceCenter(width / 2, height / 2))
//           .force('collision', d3.forceCollide().radius(30));
//         break;
//       case 'circular':
//         simulation = d3.forceSimulation(nodes)
//           .force('link', d3.forceLink(links).id(d => d.id).distance(80))
//           .force('charge', d3.forceManyBody().strength(-forceStrength * 100))
//           .force('center', d3.forceCenter(width / 2, height / 2))
//           .force('x', d3.forceX(width / 2).strength(0.1))
//           .force('y', d3.forceY(height / 2).strength(0.1));
//         break;
//       case 'matrix':
//         const n = nodes.length;
//         const size = Math.min(width, height) * 0.6;
//         const step = n > 1 ? size / (n - 1) : 0;
//         nodes.forEach((node, i) => {
//           node.x = width / 2 - size / 2 + i * step;
//           node.y = height / 2 - size / 2 + i * step;
//           node.fx = node.x;
//           node.fy = node.y;
//         });
//         simulation = d3.forceSimulation(nodes)
//           .force('link', d3.forceLink(links).id(d => d.id).distance(0))
//           .force('charge', d3.forceManyBody().strength(0));
//         break;
//     }

//     this.simulation = simulation;

//     // Draw links
//     const link = g.append('g')
//       .attr('stroke', document.getElementById('linkColor').value)
//       .attr('stroke-opacity', 0.6)
//       .selectAll()
//       .data(links)
//       .join('line')
//       .attr('stroke-width', d => Math.sqrt(d.value || 1) * parseFloat(document.getElementById('linkWidth').value));

//     // Draw nodes
//     const node = g.append('g')
//       .attr('stroke', '#fff')
//       .attr('stroke-width', 1.5)
//       .selectAll()
//       .data(nodes)
//       .join('g')
//       .attr('class', 'node')
//       .style('cursor', 'pointer')
//       .on('click', (event, d) => {
//         this.selectNode(d);
//       })
//       .on('mouseover', (event, d) => {
//         this.showTooltip(event, d);
//       })
//       .on('mouseout', () => {
//         this.hideTooltip();
//       })
//       .call(d3.drag()
//         .on('start', (event, d) => {
//           if (!event.active) simulation.alphaTarget(0.3).restart();
//           d.fx = d.x;
//           d.fy = d.y;
//         })
//         .on('drag', (event, d) => {
//           d.fx = event.x;
//           d.fy = event.y;
//         })
//         .on('end', (event, d) => {
//           if (!event.active) simulation.alphaTarget(0);
//           d.fx = null;
//           d.fy = null;
//         }));

//     // Add circles to nodes
//     node.append('circle')
//       .attr('r', document.getElementById('nodeSize').value)
//       .attr('fill', d => color(d.group || d.id));

//     // Add labels to nodes
//     node.append('text')
//       .attr('dy', '0.35em')
//       .attr('text-anchor', 'middle')
//       .text(d => d.name)
//       .style('font-size', '10px')
//       .style('font-weight', '500')
//       .style('fill', '#2d3748')
//       .style('stroke', 'white')
//       .style('stroke-width', 2)
//       .style('paint-order', 'stroke')
//       .style('pointer-events', 'none');

//     // Update positions
//     simulation.on('tick', () => {
//       link
//         .attr('x1', d => d.source.x)
//         .attr('y1', d => d.source.y)
//         .attr('x2', d => d.target.x)
//         .attr('y2', d => d.target.y);

//       node.attr('transform', d => `translate(${d.x},${d.y})`);
//     });

//     // Apply zoom transform
//     this.svg.call(this.zoom);
//   }

//   selectNode(d) {
//     // Clear previous selection
//     d3.selectAll('.node.selected').classList.remove('selected');
//     // Select current node
//     d3.select(event.target.closest('.node')).classList.add('selected');
//   }

//   showTooltip(event, d) {
//     const tooltip = d3.select('#tooltip');
//     const nodeData = d.data || d;

//     let content = `<div class="tooltip-title">${nodeData.name || 'Node'}</div>`;

//     if (nodeData.data) {
//       Object.entries(nodeData.data).forEach(([key, value]) => {
//         if (key !== 'name' && value) {
//           content += `<div class="tooltip-content"><strong>${key}:</strong> ${value}</div>`;
//         }
//       });
//     }

//     tooltip
//       .style('left', (event.pageX + 15) + 'px')
//       .style('top', (event.pageY - 10) + 'px')
//       .html(content)
//       .classed('show', true);
//   }

//   hideTooltip() {
//     d3.select('#tooltip').classed('show', false);
//   }
// }

// graphRenderer.js
class GraphRenderer {
  constructor(svg, zoom) {
    this.svg = svg;
    this.zoom = zoom;
    this.simulation = null;
  }

  render(graphData, type, container) {
    if (!graphData) return;

    this.svg.selectAll('*').remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.svg.attr('viewBox', [0, 0, width, height]);

    const g = this.svg.append('g');

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const links = graphData.links.map(d => ({ ...d }));
    const nodes = graphData.nodes.map(d => ({ ...d }));

    let simulation;
    const forceStrength = parseFloat(document.getElementById('forceStrength').value);

    switch (type) {
      case 'force':
        simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(100))
          .force('charge', d3.forceManyBody().strength(-forceStrength * 200))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(35));
        break;
      case 'circular':
        simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(120))
          .force('charge', d3.forceManyBody().strength(-forceStrength * 150))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('x', d3.forceX(width / 2).strength(0.1))
          .force('y', d3.forceY(height / 2).strength(0.1));
        break;
      case 'matrix':
        const n = nodes.length;
        const size = Math.min(width, height) * 0.6;
        const step = n > 1 ? size / (n - 1) : 0;
        nodes.forEach((node, i) => {
          node.x = width / 2 - size / 2 + i * step;
          node.y = height / 2 - size / 2 + i * step;
          node.fx = node.x;
          node.fy = node.y;
        });
        simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(0))
          .force('charge', d3.forceManyBody().strength(0));
        break;
    }
    simulation.alpha(1).restart();
    simulation.alphaDecay(0.2).velocityDecay(0.4);

    this.simulation = simulation;

    const link = g.append('g')
      .attr('stroke', document.getElementById('linkColor').value)
      .attr('stroke-opacity', 0.4)
      .selectAll()
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value || 1) * parseFloat(document.getElementById('linkWidth').value))
      .style('stroke-linecap', 'round');

    const node = g.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll()
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        this.selectNode(d);
      })
      .on('mouseover', (event, d) => {
        this.showTooltip(event, d);
      })
      .on('mouseout', () => {
        this.hideTooltip();
      })
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })

        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('circle')
      .attr('r', +document.getElementById('nodeSize').value || 20)
      .attr('fill', d => color(d.group || d.id))
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))');

    node.append('text')
      .attr('dy', -25)
      .attr('text-anchor', 'middle')
      .text(d => d.name)
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#2d3748')
      .style('stroke', 'white')
      .style('stroke-width', 3)
      .style('paint-order', 'stroke')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    this.svg.call(this.zoom);
  }

  selectNode(d) {
    d3.selectAll('.node.selected').classed('selected', false);
    d3.select(event.target.closest('.node')).classed('selected', true);
  }

  showTooltip(event, d) {
    const tooltip = d3.select('#tooltip');
    const nodeData = d.data || d;

    let content = `<div class="tooltip-title">${nodeData.name || 'Node'}</div>`;
    if (nodeData.data) {
      Object.entries(nodeData.data).forEach(([key, value]) => {
        if (key !== 'name' && value) {
          content += `<div class="tooltip-content"><strong>${key}:</strong> ${value}</div>`;
        }
      });
    }

    tooltip
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .html(content)
      .classed('show', true);
  }

  hideTooltip() {
    d3.select('#tooltip').classed('show', false);
  }
}