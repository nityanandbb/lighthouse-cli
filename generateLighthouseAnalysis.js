// generateLighthouseAnalysis.js :- used fn in HTML
const fs = require("fs");
const path = require("path");

class LighthouseAnalyzer {
  constructor() {
    this.analysisData = {};
  }

  // Function to read Lighthouse JSON reports from .lighthouseci directory
  readLighthouseReports() {
    const reportsDir = ".lighthouseci";
    const reports = [];

    try {
      if (!fs.existsSync(reportsDir)) {
        console.error(`Directory ${reportsDir} does not exist`);
        return reports;
      }

      const files = fs.readdirSync(reportsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      console.log(`Found ${jsonFiles.length} JSON files in ${reportsDir}`);

      jsonFiles.forEach(file => {
        try {
          const filePath = path.join(reportsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const reportData = JSON.parse(content);
          
          // Extract URL and device type from the report
          const url = reportData.finalUrl || reportData.requestedUrl;
          const deviceType = this.detectDeviceType(reportData);
          
          reports.push({
            filename: file,
            url: url,
            deviceType: deviceType,
            data: reportData
          });
          
          console.log(`✅ Processed: ${file} - ${url} (${deviceType})`);
        } catch (error) {
          console.error(`❌ Error processing file ${file}:`, error.message);
        }
      });

      return reports;
    } catch (error) {
      console.error("Error reading Lighthouse reports:", error);
      return reports;
    }
  }

  // Detect device type from Lighthouse report
  detectDeviceType(reportData) {
    try {
      // Check configSettings for device type
      if (reportData.configSettings) {
        if (reportData.configSettings.emulatedFormFactor) {
          return reportData.configSettings.emulatedFormFactor;
        }
        
        // Check screen emulation settings
        if (reportData.configSettings.screenEmulation) {
          const width = reportData.configSettings.screenEmulation.width;
          return width <= 480 ? 'mobile' : 'desktop';
        }
      }

      // Check environment for device indicators
      if (reportData.environment) {
        const userAgent = reportData.environment.networkUserAgent || '';
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
          return 'mobile';
        }
      }

      // Default fallback
      return 'desktop';
    } catch (error) {
      console.error("Error detecting device type:", error);
      return 'desktop';
    }
  }

  // Extract metrics from Lighthouse report
  extractMetrics(categories) {
    try {
      return {
        performance: Math.round((categories.performance?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100)
      };
    } catch (error) {
      console.error("Error extracting metrics:", error);
      return { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };
    }
  }

  // Extract issues from audits
  extractIssues(audits) {
    const issues = {
      performance: [],
      accessibility: [],
      bestPractices: [],
      seo: []
    };

    // Mapping of audit IDs to categories
    const categoryMapping = {
      // Performance audits
      'largest-contentful-paint': 'performance',
      'first-contentful-paint': 'performance',
      'speed-index': 'performance',
      'interactive': 'performance',
      'total-blocking-time': 'performance',
      'cumulative-layout-shift': 'performance',
      'unused-javascript': 'performance',
      'unused-css-rules': 'performance',
      'render-blocking-resources': 'performance',
      'efficient-animated-content': 'performance',
      'legacy-javascript': 'performance',
      'modern-image-formats': 'performance',
      'uses-optimized-images': 'performance',
      'uses-text-compression': 'performance',
      'uses-responsive-images': 'performance',
      'offscreen-images': 'performance',
      'unminified-css': 'performance',
      'unminified-javascript': 'performance',
      'uses-rel-preconnect': 'performance',
      'uses-rel-preload': 'performance',
      'font-display': 'performance',
      'mainthread-work-breakdown': 'performance',
      'bootup-time': 'performance',
      'uses-long-cache-ttl': 'performance',
      'duplicated-javascript': 'performance',
      
      // Accessibility audits
      'color-contrast': 'accessibility',
      'image-alt': 'accessibility',
      'button-name': 'accessibility',
      'link-name': 'accessibility',
      'heading-order': 'accessibility',
      'label': 'accessibility',
      'aria-allowed-attr': 'accessibility',
      'aria-required-attr': 'accessibility',
      'aria-valid-attr-value': 'accessibility',
      'aria-valid-attr': 'accessibility',
      'form-field-multiple-labels': 'accessibility',
      'frame-title': 'accessibility',
      'duplicate-id-aria': 'accessibility',
      'duplicate-id-active': 'accessibility',
      'html-has-lang': 'accessibility',
      'html-lang-valid': 'accessibility',
      'valid-lang': 'accessibility',
      'meta-viewport': 'accessibility',
      'object-alt': 'accessibility',
      'video-caption': 'accessibility',
      
      // Best Practices audits
      'is-on-https': 'bestPractices',
      'uses-http2': 'bestPractices',
      'no-vulnerable-libraries': 'bestPractices',
      'csp-xss': 'bestPractices',
      'external-anchors-use-rel-noopener': 'bestPractices',
      'doctype': 'bestPractices',
      'charset': 'bestPractices',
      'password-inputs-can-be-pasted-into': 'bestPractices',
      'image-aspect-ratio': 'bestPractices',
      'image-size-responsive': 'bestPractices',
      'preload-fonts': 'bestPractices',
      'no-document-write': 'bestPractices',
      'geolocation-on-start': 'bestPractices',
      'notification-on-start': 'bestPractices',
      'deprecations': 'bestPractices',
      'third-party-cookies': 'bestPractices',
      'errors-in-console': 'bestPractices',
      
      // SEO audits
      'meta-description': 'seo',
      'document-title': 'seo',
      'crawlable-anchors': 'seo',
      'robots-txt': 'seo',
      'hreflang': 'seo',
      'canonical': 'seo',
      'http-status-code': 'seo',
      'font-size': 'seo',
      'tap-targets': 'seo',
      'is-crawlable': 'seo',
      'structured-data': 'seo'
    };

    try {
      Object.entries(audits).forEach(([auditId, audit]) => {
        if (audit.score !== null && audit.score < 1) {
          const category = categoryMapping[auditId] || 'bestPractices';
          
          const issue = {
            id: auditId,
            title: audit.title || auditId,
            description: audit.description || 'No description available',
            score: audit.score,
            displayValue: audit.displayValue || '',
            savings: this.calculateSavings(audit)
          };

          issues[category].push(issue);
        }
      });
    } catch (error) {
      console.error("Error extracting issues:", error);
    }

    return issues;
  }

  // Calculate potential savings from audit
  calculateSavings(audit) {
    try {
      if (audit.details && audit.details.overallSavingsMs) {
        return `${Math.round(audit.details.overallSavingsMs)}ms`;
      }
      if (audit.details && audit.details.overallSavingsBytes) {
        return this.formatBytes(audit.details.overallSavingsBytes);
      }
      if (audit.numericValue && audit.id && audit.id.includes('unused')) {
        return this.formatBytes(audit.numericValue);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Format bytes to human readable format
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Generate recommendations based on issues
  generateRecommendations(issues) {
    const recommendations = [];
    
    if (issues.performance.length > 0) {
      recommendations.push({
        title: 'Optimize Performance',
        description: 'Focus on reducing unused JavaScript/CSS, optimizing images, and improving Core Web Vitals.'
      });
    }
    
    if (issues.accessibility.length > 0) {
      recommendations.push({
        title: 'Improve Accessibility',
        description: 'Ensure proper color contrast, add alt text to images, and fix ARIA attributes.'
      });
    }
    
    if (issues.bestPractices.length > 0) {
      recommendations.push({
        title: 'Follow Best Practices',
        description: 'Implement HTTPS, update vulnerable libraries, and add proper security headers.'
      });
    }
    
    if (issues.seo.length > 0) {
      recommendations.push({
        title: 'Enhance SEO',
        description: 'Add meta descriptions, ensure proper title tags, and fix crawlable links.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Great Job!',
        description: 'This page follows most best practices. Continue monitoring and maintain these high standards.'
      });
    }

    return recommendations;
  }

  // Process all reports and generate analysis data
  processReports() {
    console.log("🔍 Starting Lighthouse analysis processing...");
    
    const reports = this.readLighthouseReports();
    
    if (reports.length === 0) {
      console.log("⚠️  No Lighthouse reports found to process.");
      return;
    }

    console.log(`📊 Processing ${reports.length} Lighthouse reports...`);

    reports.forEach(report => {
      try {
        const analysisKey = `${report.url}_${report.deviceType}`;
        
        console.log(`🔬 Analyzing: ${analysisKey}`);

        const categories = report.data.categories || {};
        const audits = report.data.audits || {};

        const metrics = this.extractMetrics(categories);
        const issues = this.extractIssues(audits);
        const recommendations = this.generateRecommendations(issues);

        this.analysisData[analysisKey] = {
          url: report.url,
          deviceType: report.deviceType,
          filename: report.filename,
          analysisDate: new Date().toISOString(),
          metrics: metrics,
          issues: issues,
          recommendations: recommendations
        };

        console.log(`✅ Analysis completed for ${analysisKey}`);
        
      } catch (error) {
        console.error(`❌ Error analyzing ${report.filename}:`, error.message);
        
        // Store error information
        const analysisKey = `${report.url}_${report.deviceType}`;
        this.analysisData[analysisKey] = {
          url: report.url,
          deviceType: report.deviceType,
          filename: report.filename,
          error: `Analysis failed: ${error.message}`,
          analysisDate: new Date().toISOString()
        };
      }
    });

    // Save analysis data to file
    this.saveAnalysisData();
  }

  // Save analysis data to JSON file
  saveAnalysisData() {
    try {
      const filename = "lighthouse-analysis-data.json";
      fs.writeFileSync(filename, JSON.stringify(this.analysisData, null, 2));
      console.log(`✅ Analysis data saved to ${filename}`);
      
      // Print summary
      const totalAnalyzed = Object.keys(this.analysisData).length;
      const errorsCount = Object.values(this.analysisData).filter(data => data.error).length;
      const successCount = totalAnalyzed - errorsCount;
      
      console.log("\n📊 Analysis Summary:");
      console.log(`Total URLs processed: ${totalAnalyzed}`);
      console.log(`Successful analyses: ${successCount}`);
      console.log(`Failed analyses: ${errorsCount}`);
      
      if (errorsCount > 0) {
        console.log("\n❌ Failed analyses:");
        Object.entries(this.analysisData).forEach(([key, data]) => {
          if (data.error) {
            console.log(`  - ${key}: ${data.error}`);
          }
        });
      }
      
    } catch (error) {
      console.error("Error saving analysis data:", error);
    }
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new LighthouseAnalyzer();
  analyzer.processReports();
}

module.exports = LighthouseAnalyzer;
