# Step 1: Manual/code analysis (reads all .lighthouseci/lhr-*.json)
node analysis.js .lighthouseci 0
# writes: per_url_prioritized.json, site_common_issues.json

# Step 2: Management summary (top 10–20)
node summary.js site_common_issues.json 20
# writes: summary_report.json


npm run analysis        # writes per_url_prioritized.json + site_common_issues.json (at repo root)
npm run analysis:summary  # writes summary_report.json
