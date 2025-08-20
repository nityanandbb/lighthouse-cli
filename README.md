# lighthouse-cli
example Github executions flow :- 
{
  "inputs": {
    "projectName": "MyProject",
    "client": "ClientABC",
    "projectManager": "John Doe",
    "qaManager": "Jane Smith",
    "expectedLoadTime": "5 seconds",
    "urls": "https://www.qed42.com/about,https://www.example.com,https://www.testsite.org"
  }
}

//  "analysis:human": "node analysis/ai_site_analysis.js",         // AI → fallback (writes summary_report_final.html + ai_status.json)
    "analysis:human:ai": "node analysis/ai_site_analysis.js ai",    // force AI (fails if AI not available)
    "analysis:human:manual": "node analysis/ai_site_analysis.js manual" // force manual
# AI : # secret.sh  (NOT committed)
# export OPENAI_API_KEY="sk-xxxxxx"

Or optional without secret.sh
direct 
export OPENAI_API_KEY="sk-proj-xxxxoKhSoA"
node -e "console.log(process.env.OPENAI_API_KEY ? '✅ Key loaded' : '❌ No key')"

OR MAC LINUX

1. export OPENAI_API_KEY="sk-proj-99DkIxxxxxA"
2. node -e "console.log(process.env.OPENAI_API_KEY ? '✅ Key loaded' : '❌ No key')"

output will be : 
✅ Key loaded
