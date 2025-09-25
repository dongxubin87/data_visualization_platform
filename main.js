class VisualizationPlatform {

  constructor() {
    this.currentData = null;
    this.currentType = 'tree';
    this.currentSubType = 'horizontal';
    this.highlightedNodes = new Set();

    this.dataProcessor = new DataProcessor();
    this.exportHandler = new ExportHandler();

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupZoom();
    this.updateVisualizationType();
    this.setupRangeInputs();
    this.loadSampleData();
  }


  setupEventListeners() {
    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileUpload(e);
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchVisualizationType(e.target.dataset.type);
      });
    });

    document.getElementById('treeTypeSelect').addEventListener('change', (e) => {
      this.currentSubType = e.target.value;
      this.updateVisualization();
    });

    document.getElementById('graphTypeSelect').addEventListener('change', (e) => {
      this.currentSubType = e.target.value;
      this.updateVisualization();
    });

    document.getElementById('nodeColor').addEventListener('change', (e) => {
      this.updateNodeStyle('fill', e.target.value);
    });

    document.getElementById('nodeSize').addEventListener('input', (e) => {
      document.getElementById('nodeSizeValue').textContent = e.target.value;
      this.updateNodeStyle('r', e.target.value);
    });

    document.getElementById('linkColor').addEventListener('change', (e) => {
      this.updateLinkStyle('stroke', e.target.value);
    });

    document.getElementById('linkWidth').addEventListener('input', (e) => {
      document.getElementById('linkWidthValue').textContent = e.target.value;
      this.updateLinkStyle('stroke-width', e.target.value);
    });

    document.getElementById('resetViewBtn').addEventListener('click', () => {
      this.resetView();
    });


    document.getElementById('treeSeparation').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      document.getElementById('treeSeparationValue').textContent = value;
      if (this.currentType === 'tree' && this.treeRenderer) {
        this.treeRenderer.setSeparation(value);
      }
    });

    document.getElementById('forceStrength').addEventListener('input', (e) => {
      document.getElementById('forceStrengthValue').textContent = e.target.value;
      if (this.currentType === 'graph' && this.graphRenderer && this.graphRenderer.simulation) {
        this.graphRenderer.simulation.force('charge').strength(-parseFloat(e.target.value) * 200);
        this.graphRenderer.simulation.alpha(0.3).restart();
      }
    });
  }

  setupRangeInputs() {
    const rangeInputs = document.querySelectorAll('.range-input');
    rangeInputs.forEach(input => {
      const valueDisplay = input.parentElement.querySelector('.range-value');
      if (valueDisplay) {
        valueDisplay.textContent = input.value;
      }
    });
  }


  setupZoom() {
    const svg = d3.select('#visualizationSvg');
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform);
      });
    svg.call(this.zoom);
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.showLoading(true);

    const result = await this.dataProcessor.processFile(file);

    if (result.success) {
      this.currentData = result.data;
      this.updateVisualization();
      document.getElementById('exportBtn').disabled = false;
    } else {
      alert('File parsing failed: ' + result.error);
    }

    this.showLoading(false);
  }

  switchVisualizationType(type) {
    this.currentType = type;
    this.updateVisualizationType();
    this.updateVisualization();
  }

  updateVisualizationType() {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === this.currentType);
    });

    const treeSelect = document.getElementById('treeTypeSelect');
    const graphSelect = document.getElementById('graphTypeSelect');
    const treeParams = document.getElementById('treeParams');
    const graphParams = document.getElementById('graphParams');

    if (this.currentType === 'tree') {
      treeSelect.style.display = 'block';
      graphSelect.style.display = 'none';
      treeParams.style.display = 'none';
      graphParams.style.display = 'none';
      this.currentSubType = treeSelect.value;
    } else {
      treeSelect.style.display = 'none';
      graphSelect.style.display = 'block';
      treeParams.style.display = 'none';
      graphParams.style.display = 'block';
      this.currentSubType = graphSelect.value;
    }
  }

  updateVisualization() {
    console.log('Updating visualization...');
    console.log('Current data:', this.currentData);
    console.log('Current type:', this.currentType);
    console.log('Current sub type:', this.currentSubType);

    if (!this.currentData) {
      console.log('No current data, returning');
      return;
    }

    const svg = d3.select('#visualizationSvg');
    const container = svg.node().parentElement;
    console.log('Container size:', container.clientWidth, 'x', container.clientHeight);

    if (this.currentType === 'tree') {
      console.log('Rendering tree...');
      if (!this.treeRenderer) {
        this.treeRenderer = new TreeRenderer(svg, this.zoom);
      }
      this.treeRenderer.render(this.dataProcessor.treeData, this.currentSubType, container);
    } else {
      console.log('Rendering graph...');
      if (!this.graphRenderer) {
        this.graphRenderer = new GraphRenderer(svg, this.zoom);
      }
      this.graphRenderer.render(this.dataProcessor.graphData, this.currentSubType, container);
    }
    console.log('Visualization updated');
  }

  updateNodeStyle(property, value) {
    if (property === 'r') {
      d3.selectAll('circle').attr('r', value);
    } else {
      d3.selectAll('circle').style(property, value);
    }
  }

  updateLinkStyle(property, value) {
    if (property === 'stroke-width') {
      d3.selectAll('line').attr('stroke-width', value);
      d3.selectAll('path').attr('stroke-width', value);
    } else {
      d3.selectAll('line').style(property, value);
      d3.selectAll('path').style(property, value);
    }
  }

  // resetView() {
  //   if (this.zoom) {
  //     d3.select('#visualizationSvg').transition().duration(750).call(
  //       this.zoom.transform,
  //       d3.zoomIdentity
  //     );
  //   }

  // }
  resetView() {
    if (!this.zoom) return;
    const svg = d3.select('#visualizationSvg');

    if (this.currentType === 'tree') {
      const g = svg.select('g');
      if (!g.node()) return;

      const bbox = g.node().getBBox();
      const svgWidth = +svg.attr('width');
      const svgHeight = +svg.attr('height');

      const x = (svgWidth - bbox.width) / 2 - bbox.x;
      const y = (svgHeight - bbox.height) / 2 - bbox.y;

      svg.transition().duration(750).call(
        this.zoom.transform,
        d3.zoomIdentity.translate(x, y).scale(1)
      );
    } else {
      svg.transition().duration(750).call(
        this.zoom.transform,
        d3.zoomIdentity
      );
    }
  }



  showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
  }

  loadSampleData() {
    this.currentData = this.dataProcessor.getSampleData();
    this.dataProcessor.treeData = this.dataProcessor.buildTreeData();
    this.dataProcessor.graphData = this.dataProcessor.buildGraphData();
    this.updateVisualization();
    document.getElementById('exportBtn').disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.platform = new VisualizationPlatform();
});

window.addEventListener('resize', () => {
  if (window.platform && window.platform.currentData) {
    window.platform.updateVisualization();
  }
});