class AnalysisComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.analysisData = {};
  }

  // Load analysis data from external source
  async loadAnalysisData(dataSource) {
    try {
      if (typeof dataSource === "string") {
        // If it's a URL or file path
        const response = await fetch(dataSource);
        this.analysisData = await response.json();
      } else {
        // If it's already parsed data
        this.analysisData = dataSource;
      }
      console.log("Analysis data loaded successfully");
    } catch (error) {
      console.error("Error loading analysis data:", error);
      this.analysisData = {};
    }
  }

  // Render the analysis component
  render() {
    if (!this.container) {
      console.error("Container element not found");
      return;
    }

    const analysisKeys = Object.keys(this.analysisData);

    if (analysisKeys.length === 0) {
      this.container.innerHTML = `
        <div class="analysis-empty">
          <h3>📊 No Analysis Data Available</h3>
          <p>No Lighthouse analysis data found. Please ensure the analysis has been generated.</p>
        </div>
      `;
      return;
    }

    // Group by URL
    const groupedData = this.groupByUrl(analysisKeys);

    let html = `
      <div class="analysis-container">
        <div class="analysis-header">
          <h2>🔍 Lighthouse Analysis Dashboard</h2>
          <p>Detailed analysis for ${analysisKeys.length} reports across ${
      Object.keys(groupedData).length
    } URLs</p>
        </div>
        <div class="analysis-grid">
    `;

    Object.entries(groupedData).forEach(([url, devices]) => {
      html += this.renderUrlCard(url, devices);
    });

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  // Group analysis data by URL
  groupByUrl(analysisKeys) {
    const grouped = {};

    analysisKeys.forEach((key) => {
      const [url, deviceType] = key.split("_");
      if (!grouped[url]) {
        grouped[url] = {};
      }
      grouped[url][deviceType] = this.analysisData[key];
    });

    return grouped;
  }

  // Render a card for each URL
  renderUrlCard(url, devices) {
    const hasDesktop = devices.desktop;
    const hasMobile = devices.mobile;

    return `
      <div class="url-card">
        <div class="url-header">
          <h3 class="url-title">${this.truncateUrl(url)}</h3>
          <div class="url-full" title="${url}">${url}</div>
        </div>
        <div class="device-buttons">
          ${
            hasDesktop
              ? this.renderDeviceButton(url, "desktop", devices.desktop)
              : ""
          }
          ${
            hasMobile
              ? this.renderDeviceButton(url, "mobile", devices.mobile)
              : ""
          }
        </div>
        <div class="quick-metrics">
          ${this.renderQuickMetrics(devices)}
        </div>
      </div>
    `;
  }

  // Render device button
  renderDeviceButton(url, deviceType, deviceData) {
    const icon = deviceType === "desktop" ? "💻" : "📱";
    const hasError = deviceData && deviceData.error;
    const buttonClass = hasError ? "device-btn error" : "device-btn";
    const status = hasError ? "Error" : "View Analysis";

    return `
      <button class="${buttonClass}" 
              data-url="${url}" 
              data-device="${deviceType}"
              ${hasError ? `title="Error: ${deviceData.error}"` : ""}>
        ${icon} ${
      deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
    } - ${status}
      </button>
    `;
  }

  // Render quick metrics overview
  renderQuickMetrics(devices) {
    let html = '<div class="metrics-overview">';

    ["desktop", "mobile"].forEach((deviceType) => {
      if (devices[deviceType] && !devices[deviceType].error) {
        const metrics = devices[deviceType].metrics;
        html += `
          <div class="device-metrics">
            <div class="device-label">${
              deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
            }</div>
            <div class="metric-row">
              <span class="metric-item performance ${this.getScoreClass(
                metrics.performance
              )}">${metrics.performance}</span>
              <span class="metric-item accessibility ${this.getScoreClass(
                metrics.accessibility
              )}">${metrics.accessibility}</span>
              <span class="metric-item best-practices ${this.getScoreClass(
                metrics.bestPractices
              )}">${metrics.bestPractices}</span>
              <span class="metric-item seo ${this.getScoreClass(
                metrics.seo
              )}">${metrics.seo}</span>
            </div>
          </div>
        `;
      }
    });

    html += "</div>";
    return html;
  }

  // Get CSS class based on score
  getScoreClass(score) {
    if (score >= 90) return "excellent";
    if (score >= 50) return "good";
    return "poor";
  }

  // Truncate URL for display
  truncateUrl(url, maxLength = 40) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  }

  // Attach event listeners
  attachEventListeners() {
    const buttons = this.container.querySelectorAll(".device-btn:not(.error)");
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const url = e.target.dataset.url;
        const device = e.target.dataset.device;
        this.showDetailedAnalysis(url, device);
      });
    });
  }

  // Show detailed analysis in modal
  showDetailedAnalysis(url, deviceType) {
    const analysisKey = `${url}_${deviceType}`;
    const data = this.analysisData[analysisKey];

    if (!data || data.error) {
      this.showError(data ? data.error : "No analysis data available");
      return;
    }

    const modal = this.createModal();
    const content = modal.querySelector(".modal-body");

    content.innerHTML = `
      <div class="analysis-detail-header">
        <h2>📊 Lighthouse Analysis</h2>
        <div class="analysis-meta">
          <p><strong>URL:</strong> ${url}</p>
          <p><strong>Device:</strong> ${
            deviceType.charAt(0).toUpperCase() + deviceType.slice(1)
          } ${deviceType === "desktop" ? "💻" : "📱"}</p>
          <p><strong>Analysis Date:</strong> ${new Date(
            data.analysisDate
          ).toLocaleString()}</p>
        </div>
      </div>
      
      <div class="metrics-detailed">
        <h3>📈 Performance Metrics</h3>
        <div class="metrics-grid-detailed">
          ${this.renderDetailedMetric(
            "Performance",
            data.metrics.performance,
            "🚀"
          )}
          ${this.renderDetailedMetric(
            "Accessibility",
            data.metrics.accessibility,
            "♿"
          )}
          ${this.renderDetailedMetric(
            "Best Practices",
            data.metrics.bestPractices,
            "✅"
          )}
          ${this.renderDetailedMetric("SEO", data.metrics.seo, "🔍")}
        </div>
      </div>
      
      <div class="issues-detailed">
        <h3>🔍 Issues Analysis</h3>
        <div class="issues-grid-detailed">
          ${this.renderDetailedIssues(
            "Performance Issues",
            data.issues.performance,
            "🚀"
          )}
          ${this.renderDetailedIssues(
            "Accessibility Issues",
            data.issues.accessibility,
            "♿"
          )}
          ${this.renderDetailedIssues(
            "Best Practices Issues",
            data.issues.bestPractices,
            "✅"
          )}
          ${this.renderDetailedIssues("SEO Issues", data.issues.seo, "🔍")}
        </div>
      </div>
      
      <div class="recommendations-detailed">
        <h3>💡 Recommendations</h3>
        <div class="recommendations-list">
          ${data.recommendations
            .map(
              (rec) => `
            <div class="recommendation-item">
              <h4>${rec.title}</h4>
              <p>${rec.description}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = "block";
  }

  // Render detailed metric card
  renderDetailedMetric(label, score, icon) {
    return `
      <div class="metric-card-detailed ${this.getScoreClass(score)}">
        <div class="metric-icon">${icon}</div>
        <div class="metric-score">${score}</div>
        <div class="metric-label">${label}</div>
        <div class="metric-status">${this.getScoreStatus(score)}</div>
      </div>
    `;
  }

  // Render detailed issues section
  renderDetailedIssues(title, issues, icon) {
    if (!issues || issues.length === 0) {
      return `
        <div class="issues-category-detailed">
          <h4>${icon} ${title}</h4>
          <div class="no-issues">✅ No issues found</div>
        </div>
      `;
    }

    const issueItems = issues
      .map(
        (issue) => `
      <div class="issue-item-detailed">
        <div class="issue-title">${issue.title}</div>
        <div class="issue-description">${issue.description}</div>
        ${
          issue.savings
            ? `<div class="issue-savings">💰 Potential savings: ${issue.savings}</div>`
            : ""
        }
        ${
          issue.displayValue
            ? `<div class="issue-value">📊 Current value: ${issue.displayValue}</div>`
            : ""
        }
      </div>
    `
      )
      .join("");

    return `
      <div class="issues-category-detailed">
        <h4>${icon} ${title} (${issues.length})</h4>
        <div class="issues-list">
          ${issueItems}
        </div>
      </div>
    `;
  }

  // Get score status text
  getScoreStatus(score) {
    if (score >= 90) return "Excellent";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  }

  // Create modal element
  createModal() {
    const modal = document.createElement("div");
    modal.className = "analysis-modal";
    modal.innerHTML = `
      <div class="modal-content-detailed">
        <div class="modal-header">
          <span class="modal-close">&times;</span>
        </div>
        <div class="modal-body">
          <!-- Content will be inserted here -->
        </div>
      </div>
    `;

    // Add close functionality
    const closeBtn = modal.querySelector(".modal-close");
    closeBtn.addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    return modal;
  }

  // Show error message
  showError(message) {
    const modal = this.createModal();
    const content = modal.querySelector(".modal-body");

    content.innerHTML = `
      <div class="error-detailed">
        <h2>❌ Analysis Error</h2>
        <p>${message}</p>
      </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = "block";
  }

  // Add required CSS styles
  addStyles() {
    if (document.getElementById("analysis-component-styles")) return;

    const styles = document.createElement("style");
    styles.id = "analysis-component-styles";
    styles.textContent = `
      .analysis-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .analysis-header {
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
      }

      .analysis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 20px;
      }

      .url-card {
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 20px;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
      }

      .url-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .url-header {
        margin-bottom: 15px;
      }

      .url-title {
        font-size: 1.1rem;
        font-weight: bold;
        color: #2c3e50;
        margin: 0 0 5px 0;
      }

      .url-full {
        font-size: 0.85rem;
        color: #7f8c8d;
        word-break: break-all;
      }

      .device-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }

      .device-btn {
        flex: 1;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        background: linear-gradient(135deg, #c8a2c8, #dda0dd);
        color: black;
      }

      .device-btn:hover {
        background: #c242e0;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(194, 66, 224, 0.3);
      }

      .device-btn.error {
        background: #ffcccb;
        color: #8b0000;
        cursor: not-allowed;
      }

      .metrics-overview {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 15px;
      }

      .device-metrics {
        margin-bottom: 10px;
      }

      .device-label {
        font-weight: bold;
        color: #495057;
        margin-bottom: 5px;
      }

      .metric-row {
        display: flex;
        gap: 8px;
      }

      .metric-item {
        flex: 1;
        text-align: center;
        padding: 8px;
        border-radius: 4px;
        font-weight: bold;
        color: white;
      }

      .metric-item.excellent { background: #28a745; }
      .metric-item.good { background: #ffc107; color: #212529; }
      .metric-item.poor { background: #dc3545; }

      .analysis-modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
      }

      .modal-content-detailed {
        background: white;
        margin: 2% auto;
        border-radius: 10px;
        width: 90%;
        max-width: 1000px;
        max-height: 90%;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }

      .modal-header {
        padding: 15px 20px;
        border-bottom: 1px solid #ddd;
        text-align: right;
      }

      .modal-close {
        font-size: 28px;
        font-weight: bold;
        color: #aaa;
        cursor: pointer;
        line-height: 1;
      }

      .modal-close:hover {
        color: #000;
      }

      .modal-body {
        padding: 20px;
      }

      .analysis-detail-header {
        margin-bottom: 30px;
      }

      .analysis-detail-header h2 {
        color: #2c3e50;
        margin-bottom: 10px;
      }

      .analysis-meta {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid #007bff;
      }

      .analysis-meta p {
        margin: 5px 0;
        color: #495057;
      }

      .metrics-detailed {
        margin-bottom: 30px;
      }

      .metrics-detailed h3 {
        color: #2c3e50;
        margin-bottom: 15px;
      }

      .metrics-grid-detailed {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }

      .metric-card-detailed {
        text-align: center;
        padding: 20px;
        border-radius: 8px;
        color: white;
        position: relative;
      }

      .metric-card-detailed.excellent { background: linear-gradient(135deg, #28a745, #20c997); }
      .metric-card-detailed.good { background: linear-gradient(135deg, #ffc107, #fd7e14); color: #212529; }
      .metric-card-detailed.poor { background: linear-gradient(135deg, #dc3545, #e83e8c); }

      .metric-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }

      .metric-score {
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .metric-label {
        font-size: 0.9rem;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .metric-status {
        font-size: 0.8rem;
        opacity: 0.9;
      }

      .issues-detailed {
        margin-bottom: 30px;
      }

      .issues-detailed h3 {
        color: #2c3e50;
        margin-bottom: 15px;
      }

      .issues-grid-detailed {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }

      .issues-category-detailed {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
      }

      .issues-category-detailed h4 {
        color: #2c3e50;
        margin-bottom: 15px;
        font-size: 1.1rem;
      }

      .no-issues {
        color: #28a745;
        font-style: italic;
        text-align: center;
        padding: 20px;
      }

      .issue-item-detailed {
        background: white;
        border-left: 4px solid #dc3545;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 0 6px 6px 0;
      }

      .issue-title {
        font-weight: bold;
        color: #dc3545;
        margin-bottom: 8px;
      }

      .issue-description {
        color: #6c757d;
        margin-bottom: 8px;
        line-height: 1.4;
      }

      .issue-savings, .issue-value {
        background: #e3f2fd;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #1976d2;
        display: inline-block;
        margin-right: 8px;
        margin-bottom: 4px;
      }

      .recommendations-detailed h3 {
        color: #2c3e50;
        margin-bottom: 15px;
      }

      .recommendations-list {
        display: grid;
        gap: 15px;
      }

      .recommendation-item {
        background: #e8f5e8;
        border-left: 4px solid #28a745;
        padding: 20px;
        border-radius: 0 8px 8px 0;
      }

      .recommendation-item h4 {
        color: #155724;
        margin-bottom: 10px;
      }

      .recommendation-item p {
        color: #155724;
        line-height: 1.5;
        margin: 0;
      }

      .analysis-empty {
        text-align: center;
        padding: 60px 20px;
        color: #6c757d;
      }

      .analysis-empty h3 {
        margin-bottom: 15px;
        color: #495057;
      }

      .error-detailed {
        text-align: center;
        padding: 40px;
        color: #dc3545;
      }

      .error-detailed h2 {
        margin-bottom: 15px;
      }
    `;

    document.head.appendChild(styles);
  }

  // Initialize the component
  init(dataSource) {
    this.addStyles();
    if (dataSource) {
      this.loadAnalysisData(dataSource).then(() => {
        this.render();
      });
    } else {
      this.render();
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AnalysisComponent;
}
