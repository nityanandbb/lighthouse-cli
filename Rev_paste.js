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
return width <= 480 ? 'mobile' : 'desktop' ; } } // Check environment for device indicators if (reportData.environment)
    { const userAgent=reportData.environment.networkUserAgent || '' ; if (userAgent.includes('Mobile') ||
    userAgent.includes('Android')) { return 'mobile' ; } } // Check runtime settings if (reportData.runtimeConfig &&
    reportData.runtimeConfig.environment) { const settings=reportData.runtimeConfig.environment; if
    (settings.screenEmulation && settings.screenEmulation.mobile) { return 'mobile' ; } } // Default fallback
    return 'desktop' ; } catch (error) { console.error("Error detecting device type:", error); return 'desktop' ; } } //
    Extract metrics from Lighthouse report extractMetrics(categories) { try { return { performance:
    Math.round((categories.performance?.score || 0) * 100), accessibility: Math.round((categories.accessibility?.score
    || 0) * 100), bestPractices: Math.round((categories['best-practices']?.score || 0) * 100), seo:
    Math.round((categories.seo?.score || 0) * 100) }; } catch (error) { console.error("Error extracting metrics:",
    error); return { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }; } } // Extract issues from audits
    extractIssues(audits) { const issues={ performance: [], accessibility: [], bestPractices: [], seo: [] }; //
    Comprehensive mapping of audit IDs to categories const categoryMapping={ // Performance
    audits 'largest-contentful-paint' : 'performance' , 'first-contentful-paint' : 'performance' , 'speed-index'
    : 'performance' , 'interactive' : 'performance' , 'total-blocking-time' : 'performance' , 'cumulative-layout-shift'
    : 'performance' , 'unused-javascript' : 'performance' , 'unused-css-rules' : 'performance'
    , 'render-blocking-resources' : 'performance' , 'efficient-animated-content' : 'performance' , 'legacy-javascript'
    : 'performance' , 'modern-image-formats' : 'performance' , 'uses-optimized-images' : 'performance'
    , 'uses-text-compression' : 'performance' , 'uses-responsive-images' : 'performance' , 'offscreen-images'
    : 'performance' , 'unminified-css' : 'performance' , 'unminified-javascript' : 'performance' , 'uses-rel-preconnect'
    : 'performance' , 'uses-rel-preload' : 'performance' , 'font-display' : 'performance' , 'mainthread-work-breakdown'
    : 'performance' , 'bootup-time' : 'performance' , 'uses-long-cache-ttl' : 'performance' , 'duplicated-javascript'
    : 'performance' , 'server-response-time' : 'performance' , 'redirects' : 'performance' , 'critical-request-chains'
    : 'performance' , 'user-timings' : 'performance' , 'diagnostics' : 'performance' , 'metrics' : 'performance'
    , 'screenshot-thumbnails' : 'performance' , 'final-screenshot' : 'performance' , 'dom-size' : 'performance'
    , 'uses-passive-event-listeners' : 'performance' , 'no-document-write' : 'performance' , 'uses-http2'
    : 'performance' , 'uses-rel-dns-prefetch' : 'performance' , // Accessibility audits 'color-contrast'
    : 'accessibility' , 'image-alt' : 'accessibility' , 'button-name' : 'accessibility' , 'link-name' : 'accessibility'
    , 'heading-order' : 'accessibility' , 'label' : 'accessibility' , 'aria-allowed-attr' : 'accessibility'
    , 'aria-required-attr' : 'accessibility' , 'aria-valid-attr-value' : 'accessibility' , 'aria-valid-attr'
    : 'accessibility' , 'form-field-multiple-labels' : 'accessibility' , 'frame-title' : 'accessibility'
    , 'duplicate-id-aria' : 'accessibility' , 'duplicate-id-active' : 'accessibility' , 'html-has-lang'
    : 'accessibility' , 'html-lang-valid' : 'accessibility' , 'valid-lang' : 'accessibility' , 'meta-viewport'
    : 'accessibility' , 'object-alt' : 'accessibility' , 'video-caption' : 'accessibility' , 'definition-list'
    : 'accessibility' , 'dlitem' : 'accessibility' , 'list' : 'accessibility' , 'listitem' : 'accessibility'
    , 'tabindex' : 'accessibility' , 'td-headers-attr' : 'accessibility' , 'th-has-data-cells' : 'accessibility'
    , 'bypass' : 'accessibility' , 'focus-traps' : 'accessibility' , 'focusable-controls' : 'accessibility'
    , 'interactive-element-affordance' : 'accessibility' , 'logical-tab-order' : 'accessibility' , 'managed-focus'
    : 'accessibility' , 'offscreen-content-hidden' : 'accessibility' , 'use-landmarks' : 'accessibility'
    , 'visual-order-follows-dom' : 'accessibility' , 'accesskeys' : 'accessibility' , 'aria-allowed-role'
    : 'accessibility' , 'aria-command-name' : 'accessibility' , 'aria-hidden-body' : 'accessibility'
    , 'aria-hidden-focus' : 'accessibility' , 'aria-input-field-name' : 'accessibility' , 'aria-meter-name'
    : 'accessibility' , 'aria-progressbar-name' : 'accessibility' , 'aria-required-children' : 'accessibility'
    , 'aria-required-parent' : 'accessibility' , 'aria-roles' : 'accessibility' , 'aria-toggle-field-name'
    : 'accessibility' , 'aria-tooltip-name' : 'accessibility' , 'aria-treeitem-name' : 'accessibility' , // Best
    Practices audits 'is-on-https' : 'bestPractices' , 'no-vulnerable-libraries' : 'bestPractices' , 'csp-xss'
    : 'bestPractices' , 'external-anchors-use-rel-noopener' : 'bestPractices' , 'doctype' : 'bestPractices' , 'charset'
    : 'bestPractices' , 'password-inputs-can-be-pasted-into' : 'bestPractices' , 'image-aspect-ratio' : 'bestPractices'
    , 'image-size-responsive' : 'bestPractices' , 'preload-fonts' : 'bestPractices' , 'geolocation-on-start'
    : 'bestPractices' , 'notification-on-start' : 'bestPractices' , 'deprecations' : 'bestPractices'
    , 'third-party-cookies' : 'bestPractices' , 'errors-in-console' : 'bestPractices' , 'inspector-issues'
    : 'bestPractices' , 'js-libraries' : 'bestPractices' , 'trust-tokens' : 'bestPractices' , 'appcache-manifest'
    : 'bestPractices' , 'bf-cache' : 'bestPractices' , // SEO audits 'meta-description' : 'seo' , 'document-title'
    : 'seo' , 'crawlable-anchors' : 'seo' , 'robots-txt' : 'seo' , 'hreflang' : 'seo' , 'canonical' : 'seo'
    , 'http-status-code' : 'seo' , 'font-size' : 'seo' , 'tap-targets' : 'seo' , 'is-crawlable' : 'seo'
    , 'structured-data' : 'seo' , 'viewport' : 'seo' , 'plugins' : 'seo' }; try {
    Object.entries(audits).forEach(([auditId, audit])=> {
    if (audit.score !== null && audit.score !== undefined && audit.score < 1) { const category=categoryMapping[auditId]
        || 'bestPractices' ; const issue={ id: auditId, title: audit.title || auditId, description: audit.description
        || 'No description available' , score: audit.score, displayValue: audit.displayValue || '' , savings:
        this.calculateSavings(audit) }; issues[category].push(issue); } }); } catch (error) { console.error("Error
        extracting issues:", error); } return issues; } // Calculate potential savings from audit
        calculateSavings(audit) { try { if (audit.details && audit.details.overallSavingsMs) { return
        `${Math.round(audit.details.overallSavingsMs)}ms`; } if (audit.details && audit.details.overallSavingsBytes) {
        return this.formatBytes(audit.details.overallSavingsBytes); } if (audit.numericValue && audit.id &&
        audit.id.includes('unused')) { return this.formatBytes(audit.numericValue); } if (audit.numericValue && audit.id
        && audit.id.includes('blocking')) { return `${Math.round(audit.numericValue)}ms`; } return null; } catch (error)
        { return null; } } // Format bytes to human readable format formatBytes(bytes) { if (bytes===0) return '0 Bytes'
        ; const k=1024; const sizes=['Bytes', 'KB' , 'MB' , 'GB' ]; const i=Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]; } // Generate recommendations based on
        issues generateRecommendations(issues) { const recommendations=[]; if (issues.performance.length> 0) {
        const performanceCount = issues.performance.length;
        let priorityMessage = "Focus on reducing unused JavaScript/CSS, optimizing images, and improving Core Web
        Vitals.";

        if (performanceCount > 10) {
        priorityMessage = "Critical: Multiple performance issues detected. Prioritize unused code removal, image
        optimization, and Core Web Vitals improvements.";
        } else if (performanceCount > 5) {
        priorityMessage = "Important: Several performance optimizations needed. Focus on largest impact items first.";
        }

        recommendations.push({
        title: `🚀 Optimize Performance (${performanceCount} issues)`,
        description: priorityMessage + " Consider implementing lazy loading, code splitting, and modern image formats."
        });
        }

        if (issues.accessibility.length > 0) {
        const accessibilityCount = issues.accessibility.length;
        let accessibilityMessage = "Ensure proper color contrast, add alt text to images, and fix ARIA attributes.";

        if (accessibilityCount > 8) {
        accessibilityMessage = "Critical: Multiple accessibility barriers detected. Prioritize color contrast, missing
        labels, and keyboard navigation.";
        }

        recommendations.push({
        title: `♿ Improve Accessibility (${accessibilityCount} issues)`,
        description: accessibilityMessage + " Verify keyboard navigation works properly and screen reader
        compatibility."
        });
        }

        if (issues.bestPractices.length > 0) {
        const bestPracticesCount = issues.bestPractices.length;
        recommendations.push({
        title: `✅ Follow Best Practices (${bestPracticesCount} issues)`,
        description: "Implement HTTPS, update vulnerable libraries, add proper security headers, and fix console errors.
        Consider implementing CSP and removing deprecated APIs."
        });
        }

        if (issues.seo.length > 0) {
        const seoCount = issues.seo.length;
        recommendations.push({
        title: `🔍 Enhance SEO (${seoCount} issues)`,
        description: "Add meta descriptions, ensure proper title tags, fix crawlable links, and optimize for mobile
        devices. Implement structured data where appropriate."
        });
        }

        if (recommendations.length === 0) {
        recommendations.push({
        title: '🎉 Excellent Work!',
        description: 'This page follows most Lighthouse best practices. Continue monitoring performance and maintain
        these high standards. Consider periodic audits to catch any regressions.'
        });
        }

        return recommendations;
        }

        // Process all reports and generate analysis data
        processReports() {
        console.log("🔍 Starting Lighthouse analysis processing...");

        const reports = this.readLighthouseReports();

        if (reports.length === 0) {
        console.log("⚠️ No Lighthouse reports found to process.");
        console.log("Make sure the .lighthouseci directory exists and contains JSON files.");
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

        // Calculate total issues
        const totalIssues = Object.values(issues).reduce((sum, categoryIssues) => sum + categoryIssues.length, 0);

        this.analysisData[analysisKey] = {
        url: report.url,
        deviceType: report.deviceType,
        filename: report.filename,
        analysisDate: new Date().toISOString(),
        metrics: metrics,
        issues: issues,
        totalIssues: totalIssues,
        recommendations: recommendations,
        rawData: {
        categories: categories,
        totalAudits: Object.keys(audits).length,
        failedAudits: Object.values(audits).filter(audit => audit.score !== null && audit.score < 1).length } };
            console.log(`✅ Analysis completed for ${analysisKey} - Found ${totalIssues} issues`); } catch (error) {
            console.error(`❌ Error analyzing ${report.filename}:`, error.message); // Store error information const
            analysisKey=`${report.url}_${report.deviceType}`; this.analysisData[analysisKey]={ url: report.url,
            deviceType: report.deviceType, filename: report.filename, error: `Analysis failed: ${error.message}`,
            analysisDate: new Date().toISOString() }; } }); // Save analysis data to file this.saveAnalysisData(); } //
            Save analysis data to JSON file saveAnalysisData() { try { const filename="lighthouse-analysis-data.json" ;
            fs.writeFileSync(filename, JSON.stringify(this.analysisData, null, 2)); console.log(`✅ Analysis data saved
            to ${filename}`); // Print comprehensive summary const totalAnalyzed=Object.keys(this.analysisData).length;
            const errorsCount=Object.values(this.analysisData).filter(data=> data.error).length;
            const successCount = totalAnalyzed - errorsCount;

            console.log("\n📊 Analysis Summary:");
            console.log("=".repeat(50));
            console.log(`📈 Total URLs processed: ${totalAnalyzed}`);
            console.log(`✅ Successful analyses: ${successCount}`);
            console.log(`❌ Failed analyses: ${errorsCount}`);

            if (successCount > 0) {
            const successfulAnalyses = Object.values(this.analysisData).filter(data => !data.error);
            const avgPerformance = Math.round(successfulAnalyses.reduce((sum, data) => sum + data.metrics.performance,
            0) / successfulAnalyses.length);
            const avgAccessibility = Math.round(successfulAnalyses.reduce((sum, data) => sum +
            data.metrics.accessibility, 0) / successfulAnalyses.length);
            const totalIssuesFound = successfulAnalyses.reduce((sum, data) => sum + data.totalIssues, 0);

            console.log(`📊 Average Performance Score: ${avgPerformance}%`);
            console.log(`♿ Average Accessibility Score: ${avgAccessibility}%`);
            console.log(`🔍 Total Issues Found: ${totalIssuesFound}`);
            }

            if (errorsCount > 0) {
            console.log("\n❌ Failed analyses:");
            console.log("-".repeat(30));
            Object.entries(this.analysisData).forEach(([key, data]) => {
            if (data.error) {
            console.log(` 📱 ${key}: ${data.error}`);
            }
            });
            }

            console.log("=".repeat(50));

            } catch (error) {
            console.error("❌ Error saving analysis data:", error);
            }
            }
            }

            // Main execution
            if (require.main === module) {
            const analyzer = new LighthouseAnalyzer();
            analyzer.processReports();
            }

module.exports = LighthouseAnalyzer;
            