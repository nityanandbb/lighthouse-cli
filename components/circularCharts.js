// ===== FILE: circularCharts.js =====
// Note :- In aDevelpement. 
// Standalone Circular Charts Module for Lighthouse Reports

/**
 * Generate circular progress charts for Lighthouse metrics
 * @param {Object} metrics - Object containing all 6 metrics
 * @param {number} metrics.performanceDesktop - Desktop performance score (0-1)
 * @param {number} metrics.performanceMobile - Mobile performance score (0-1)
 * @param {number} metrics.accessibilityDesktop - Desktop accessibility score (0-1)
 * @param {number} metrics.accessibilityMobile - Mobile accessibility score (0-1)
 * @param {number} metrics.seoDesktop - Desktop SEO score (0-1)
 * @param {number} metrics.seoMobile - Mobile SEO score (0-1)
 * @returns {string} HTML string with circular charts
 */
function generateLighthouseCircularCharts(metrics) {
  // Helper function to get percentage
  const getPercentage = (score) => Math.round(score * 100);

  // Helper function to get color class based on score
  const getColorClass = (score) => {
    if (score >= 0.9) return "green";
    if (score >= 0.5) return "orange";
    return "pink";
  };

  // Helper function to generate a single circular chart
  const generateSingleChart = (score, label, deviceIcon) => {
    const percentage = getPercentage(score);
    const colorClass = getColorClass(score);

    return `
      <div class="chart-container">
        <div class="c100 p${percentage} ${colorClass}">
          <span>${percentage}%</span>
          <div class="slice">
            <div class="bar"></div>
            ${percentage > 50 ? '<div class="fill"></div>' : ""}
          </div>
        </div>
        <div class="chart-label">${label}</div>
        <div class="chart-percentage">${percentage}%</div>
        <div class="chart-device">${deviceIcon}</div>
      </div>
    `;
  };

  // Generate all 6 charts
  const chartsHTML = `
    <div class="lighthouse-charts-container">
      <h2 class="charts-title">🚀 Lighthouse Performance Metrics</h2>
      <div class="charts-grid-6">
        ${generateSingleChart(
          metrics.performanceDesktop,
          "Performance",
          "💻 Desktop"
        )}
        ${generateSingleChart(
          metrics.performanceMobile,
          "Performance",
          "📱 Mobile"
        )}
        ${generateSingleChart(
          metrics.accessibilityDesktop,
          "Accessibility",
          "💻 Desktop"
        )}
        ${generateSingleChart(
          metrics.accessibilityMobile,
          "Accessibility",
          "📱 Mobile"
        )}
        ${generateSingleChart(metrics.seoDesktop, "SEO", "💻 Desktop")}
        ${generateSingleChart(metrics.seoMobile, "SEO", "📱 Mobile")}
      </div>
    </div>
  `;

  return chartsHTML;
}

/**
 * Get the CSS styles for circular charts
 * @returns {string} CSS styles as string
 */
function getLighthouseCircularChartsCSS() {
  let css = `
    <style>
      /* Import Titillium Web Font */
      @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@200;300;400;600;700;900&display=swap');
      
      /* Container Styles */
      .lighthouse-charts-container {
        font-family: 'Titillium Web', sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 30px;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      }
      
      .charts-title {
        text-align: center;
        font-size: 2.5rem;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 40px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      }
      
      .charts-grid-6 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 30px;
        justify-items: center;
        margin: 20px 0;
      }
      
      /* Chart Container */
      .chart-container {
        text-align: center;
        padding: 20px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        min-width: 160px;
      }
      
      .chart-container:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.15);
      }
      
      .chart-label {
        font-weight: 700;
        color: #2c3e50;
        margin-top: 15px;
        font-size: 1.1rem;
        letter-spacing: 0.5px;
      }
      
      .chart-percentage {
        font-weight: 900;
        color: #3c4761;
        margin-top: 8px;
        font-size: 1.4rem;
        background: linear-gradient(135deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .chart-device {
        font-size: 0.9rem;
        color: #666;
        margin-top: 5px;
        font-weight: 600;
      }
      
      /* Circular Progress Styles */
      .c100 {
        position: relative;
        font-size: 120px;
        width: 1em;
        height: 1em;
        border-radius: 50%;
        background-color: #dfe8ed;
        margin: 0 auto;
        transition: all 0.3s ease;
      }
      
      .c100 *, .c100 *:before, .c100 *:after {
        box-sizing: content-box;
      }
      
      .c100 > span {
        position: absolute;
        width: 100%;
        z-index: 1;
        left: 0;
        top: 0;
        width: 5em;
        line-height: 5em;
        font-size: 0.2em;
        color: #3c4761;
        display: block;
        text-align: center;
        white-space: nowrap;
        transition: all 0.2s ease-out;
        font-weight: 700;
      }
      
      .c100:after {
        position: absolute;
        top: 0.09em;
        left: 0.09em;
        display: block;
        content: " ";
        border-radius: 50%;
        background-color: #ffffff;
        width: 0.82em;
        height: 0.82em;
        transition: all 0.2s ease-in;
      }
      
      .c100:hover > span {
        width: 3.33em;
        line-height: 3.33em;
        font-size: 0.3em;
        color: #3c4761;
      }
      
      .c100:hover:after {
        top: 0.07em;
        left: 0.07em;
        width: 0.86em;
        height: 0.86em;
      }
      
      .c100 .slice {
        position: absolute;
        width: 1em;
        height: 1em;
        clip: rect(0em, 1em, 1em, 0.5em);
      }
      
      .c100 .bar {
        position: absolute;
        border: 0.09em solid #000;
        width: 0.82em;
        height: 0.82em;
        clip: rect(0em, 0.5em, 1em, 0em);
        border-radius: 50%;
        transform: rotate(0deg);
        transition: all 0.3s ease;
      }
      
      .c100 .fill {
        position: absolute;
        border: 0.09em solid #000;
        width: 0.82em;
        height: 0.82em;
        clip: rect(0em, 0.5em, 1em, 0em);
        border-radius: 50%;
        transform: rotate(180deg);
      }
      
      /* Color Classes */
      .c100.green .bar, .c100.green .fill { border-color: #15c7a8 !important; }
      .c100.orange .bar, .c100.orange .fill { border-color: #eb7d4b !important; }
      .c100.pink .bar, .c100.pink .fill { border-color: #d74680 !important; }
      .c100.blue .bar, .c100.blue .fill { border-color: #30bae7 !important; }
      
      /* Responsive Design */
      @media (max-width: 768px) {
        .charts-grid-6 {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 20px;
        }
        
        .c100 {
          font-size: 100px;
        }
        
        .charts-title {
          font-size: 2rem;
        }
        
        .lighthouse-charts-container {
          padding: 20px;
        }
      }
      
      @media (max-width: 480px) {
        .charts-grid-6 {
          grid-template-columns: repeat(2, 1fr);
        }
      }
  `;

  // Generate percentage rotation CSS (1-100)
  for (let i = 1; i <= 100; i++) {
    css += `
      .c100.p${i} .bar { transform: rotate(${(360 / 100) * i}deg); }`;

    if (i > 50) {
      css += `
      .c100.p${i} .slice { clip: rect(auto, auto, auto, auto); }
      .c100.p${i} .bar:after { transform: rotate(180deg); }`;
    }
  }

  css += `
    </style>
  `;

  return css;
}

/**
 * Complete function to inject charts into DOM
 * @param {string} containerId - ID of the container element
 * @param {Object} metrics - Object containing all 6 metrics
 */
function injectLighthouseCharts(containerId, metrics) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  // Inject CSS if not already present
  if (!document.getElementById("lighthouse-charts-css")) {
    const styleElement = document.createElement("div");
    styleElement.id = "lighthouse-charts-css";
    styleElement.innerHTML = getLighthouseCircularChartsCSS();
    document.head.appendChild(styleElement.firstChild);
  }

  // Inject HTML
  container.innerHTML = generateLighthouseCircularCharts(metrics);
}

// Export functions for different usage patterns
if (typeof module !== "undefined" && module.exports) {
  // Node.js environment
  module.exports = {
    generateLighthouseCircularCharts,
    getLighthouseCircularChartsCSS,
    injectLighthouseCharts,
  };
} else {
  // Browser environment - attach to window
  window.LighthouseCharts = {
    generate: generateLighthouseCircularCharts,
    getCSS: getLighthouseCircularChartsCSS,
    inject: injectLighthouseCharts,
  };
}
