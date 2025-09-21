// exportHandler.js
class ExportHandler {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Export dropdown
    document.getElementById('exportBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleExportMenu();
    });

    document.getElementById('exportMenu').addEventListener('click', (e) => {
      if (e.target.closest('.export-option')) {
        const format = e.target.closest('.export-option').dataset.format;
        this.exportVisualization(format);
        this.toggleExportMenu();
      }
    });

    // Close export menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.export-dropdown')) {
        document.getElementById('exportMenu').classList.remove('show');
      }
    });
  }

  toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.toggle('show');
  }

  async exportVisualization(format) {
    const svg = document.getElementById('visualizationSvg');
    const svgData = new XMLSerializer().serializeToString(svg);

    switch (format) {
      case 'svg':
        this.downloadSVG(svgData);
        break;
      case 'png':
        await this.downloadPNG(svg);
        break;
      case 'pdf':
        await this.downloadPDF(svg);
        break;
    }
  }

  downloadSVG(svgData) {
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `visualization_${this.currentType}_${this.currentSubType}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  async downloadPNG(svg) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // 提高分辨率
    const scale = 4; // 4倍分辨率
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = svg.clientWidth * scale;
        canvas.height = svg.clientHeight * scale;

        // 设置高质量渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 填充白色背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制图像
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `visualization_${this.currentType}_${this.currentSubType}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);
          resolve();
        }, 'image/png', 1.0);
      };
      img.src = svgUrl;
    });
  }

  async downloadPDF(svg) {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'mm', 'a4');

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const imgWidth = 280;
          const imgHeight = (img.height * imgWidth) / img.width;

          pdf.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);
          pdf.save(`visualization_${this.currentType}_${this.currentSubType}.pdf`);

          URL.revokeObjectURL(svgUrl);
          resolve();
        };
        img.onerror = () => {
          console.error('Failed to load image for PDF export');
          URL.revokeObjectURL(svgUrl);
          resolve();
        };
        img.src = svgUrl;
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
  }
}