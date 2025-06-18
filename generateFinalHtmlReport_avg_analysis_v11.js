const fs = require("fs");
const { execSync } = require("child_process");
// Require the PDF generation function
const {
  generatePdfReportFromData,
} = require("./components/generatePdfReportFromData_v11NA"); // Adjust path as needed generatePdfReportFromData

const logo =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxIHEhAQDxAVEBMWFxYbFxUWGBYVEBsSHRgiGxoYGRkeIDQgHh8mIBkZITIhMSstLy4vIyIzODM4NyktLi8BCgoKDQ0OGxAQGSslHyUyNzc3Ny03NzU3Nys3LzU1MTg3LTcyNis1KyssNzc2LSsyLS44LTg1NywrOC0tKy0rLf/AABEIAJYBLAMBIgACEQEDEQH/xAAcAAEAAgIDAQAAAAAAAAAAAAAABwgFBgIDBAH/xABSEAABAwIDAwYFDgoJBAMAAAABAAIDBBEFBhIHITETMkFRYXEIgZGT0RQXIiM1QlJicnShsbPSFRZDREVUVaLB8FNjgoOEkrLD4iVz4eMkMzT/xAAaAQEAAgMBAAAAAAAAAAAAAAAAAgUBAwYE/8QAJREBAAEDBAEDBQAAAAAAAAAAAAECAxEEBRIhMRMiQRVhcZGh/9oADAMBAAIRAxEAPwCcUREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERARF4J8Yp6ZxZJURMcOLXPa1w7wSjMUzPiHvRcWuDgCN4XJGBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFDudMp1tfWVE0UBcxxFnam7wGgcL9imJaRje0KLCppYDA9zmG1w4AFQr447WO23NRRcmbFPKcfxkMKzZR6YYOXHKWYzTZ3P3C3C3FbOq9YG7lKynda15mH98Kwqjar5RKe6aKjS1UxTM9xnsREW1ViIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICItH2mZlny62mNM5oLy/Vdodw02+srEzhtsWar1cW6fMuOb89Oy9UcgIWvGlrrkkHeouxjETi08s5bpLzfSN9l04xjMuOyctUEOfYDcA0WC6IxwXku1TU7Pb9Fb09ETj3Y7ZTL4/wDlU3/dj/1BWEWlyZVpMPpzUxRaZWR62u1PPsw3UDYm3FYTJudKrFqyKCVzSx2u9mgHc0kb/Etlr2dT8qfXzO4RN61HVETnKT0RF6HPix+M4zT4HGZqqZsLB0uPE9TRxJ7AvPmnMEWWKaSqnPsW8GjnOeeawdp+jeehVYzVmaozVO6epeT8Fg5jGfBaP5ugl7GtusMRLaOldIPhyHQPEwXP0hYMbdKu/wD+aC3VaS/+tadlfZ9X5nAfBDpiP5WQ6I/F0u8QK22XYZXMbdtTTud8G8gHiOlBseCbcYJyG1lM6G/v4zraO9psfJdSjheKQ4xGJqaVs0Z4Oabi/Ueo9hVWcyZNrcs76qAtYTYSNIdET8ocO42K68qZoqMqTCamfu3a4z/9b29Th/HiEFt1q+0DNwyXTsqTCZw6UR6Q/Ra7XOvfSfg8O1ZLLGPRZlpo6qnPsXDe085rxzmu7QtE8IX3Oh+cs+zkQYj1+mn9HHz3/rT1+m/s8+e/4KI8AwmTHZ4qWC3KSEhuo2buBO89wW7nYrifXT+cP3UGy+v039nnz3/BPX7b+zj57/gtYOxXE/6jzh+6vnrLYp/UecP3UEkZC2pjOFV6kFIYfYOfr5TXzbbraB1ru2gbTm5MqGUxpTPqja/UJNHFzm2tpPwfpWA2V7N63K1camq5LRyT2+weXO1Ettut2Fav4Qg/6lD82Z9pIg2L1+2fs53nh9xfRt6j/Z7vPD7ijLKOT6nNxlbShl4w0u1u0869vqK2J2xnFB72E/3n/hBv2GbcKGpIE8E8HxrNkZ9Bv9C3/A8wUuYGcpSTsmA46TZw+U07x4wqz45s+xLAmmSeldyY4vYWyNA6zpJIHesLg2Lz4HK2emkdFI3pHT2EdI7CguMi1HZznNmcafXYMnjsJYxwB6HN+KbHu3hbcgIiwWcsxx5VpZaqSxI3MZwL5TzW/wAT2AoNcz/tQgybMyn5E1MhGp7WvDNDTzbmx3nq6u8L17OtoDc8+qNNO6DkeT4vD769XYLc1VlxStkxaWWoncXySOLnOPWf4KYfBrFvwn/h/wDcQTcsFmjNlJlZgfVyhhPNYPZSu+S3+JsFkMZxFmEwTVMnNiY557dIvbx8FUXMGNy5hqJamodqe837Gt6Gt6gEEv123pgdaChc5vXJIGkjuANvKszl3bTRYk4MqY30hPvieUhv2kC48i0fLGxipxeBk887aXWAWsLC9+k8C7eNPctYzpkepyc9rZ7PjffRK3mOt0dh7PrQWpgnbUta+Nwe1wu1zSC0jrBG4rtUD7CM1vp5zh0ryY5ATFc82UC5A7HC/jHap4QadtTrpKChMkL3Ru5Rg1NJBtv6lCddi8+K6fVEz5dN9Otxda/G11N20/DpcUoXRU8ZlfrYdLeNgoSxLBKnBtHqmF0Wq+nUONuKjU6TaPT9PvHLM/l0tKnHJVFTSUNO58cJcWm5IYXXueJUFNK5aui61R0sdZpp1FEUxVxxLYK7MdS8yR+qHllyLajp09Vli6asfRuEkTzG8cHNNnDxry6l3UVLJiD2xQsMj3Xs0cTYXKhiZl64i3RRMYiI+UkbKcaqMSqZmTzyStERIDnFwvraL7+9Soos2U4DU4XUzPqIHxNMRALhYatTTb6FKa9FGePbj9zm3Oon08Y68K87fcfdW1rKJp9rp2guHQZnjUT4mlo8ZXg2N5LbmaodNUN1U8FiWng+Q81p7NxJ8XWsJtKcZMVxAn+mcPENw+gKXNh9XT4XhjnTTRRF08hOt7We9aBxPYpK9KMbBGAGgAAWAG4AdQXNY+lxulqzaKqhkPU2Rjj9BWQQdNXSsrWOjlY2RjhZzXC7SOohVp2qZOGUqkclf1PMC6K+8tI5zL9Nrjf1EKzijLwgKZsuHRyHnMnZY9NnNcCPq8iDTNgePmjq5KJx9rnaXNHVMwX+loPkC3HwhPc6H5yz7KRQ/s0lMOKYeR0zNHid7E/QVL/hC+50Pzln2ciCKdkfuvQfKk+ycrTKmlDVPoHtlhe6ORu9r2mzgewrLuzxif7QqPOP9KC2iKpRzziZ/SFR5x/pXz8ecTH6QqPOO9KC2yrv4QnulD82Z9pIs3sJzFWYzV1LKqplna2G4a9xcA7WBcXWE8Ib3Rg+bM+0egy/g4n2eIfJh+t6nFQd4OHPxD5MP1vU4oPhGriq9baMltwGVlXTt0wTEhzQLNZNxsOoOFz4j2Kwy0jbLAJsIqy73picD1HlWj6iUEKbJMZdg2J02+zJjyTx0EP3N8j9JVolTfBJTDU0zhxEsZHeHhXIQcSQ3edwVYtrOc/xqq9ELiaaG7Y+pzvfSePgOwDrKknblnT8EQ+oIHWmmb7YRxbAejvdvHdfrCjjY/k38aKrlJm3pobOffg5/vY/HxPYO1BruM4BLg0dM6YaXTx8oGEWIj1ENJ77X8ilLwbf0l/h/wDcWL8IU2racdVO3/W9ZPwbeOJf4f8A3EEh7TsNqcXw6eno2cpLIYxp1Nb7EPBdvcQOhQtlvZXicVXSuqaK0LZozITLCRyYeC7cH79ysoiAo527uYMM9nbVy0ejr1WN7f2dS3zEa6PDI3zTvEcbBdzjwA/no6VWTaVnd+cJ7tuynjuImHj2vd8Y/Qg8Gz55ZieHlvHl4h4i8A/RdW0Vf9hGVnVtSa+RtoobhhPvpiLbvkg37y1WAQFGm2WjfWNo9Ntxl4/2VJaweZsvjHhGDJyegk83Ve9u0dSNti9VZriunzCCoMuTS8Czyn0LItyRVPBcNFh8ZbjiWD/gWZsevXdode2npI6+xZWA+1v8ajwhY/WdT9v0iyfL01Pudp8qzmzXD3wYjA42sBJwP9W5ZOsi9USBt+JAW4YBkz8ETNn5bWWg7tNuII437ViKIhC5u2ouUTROMS25ERTVis+2jCjhuKTPt7GcMkaf7Ol37zT5VptLSPrnNjhY6R7twawFzyewDeVZDa1k85qpLwtvUQ3dH1ub76Px2Fu0DrVbqOqkw2RskbnRSsNw4Xa9rgg99VlSvphqkoqho6zDJb6l3YLm+vy6QIKmWMD8m46ov8jtylbJ+2iKRrY8SY5jxu5ZgvGe1zRvB7r+JZjM5wDNsbnS1VOyQjdM1zY6gHtB3u7iEHnyBtbix5zaeta2nnNg14PtL3dW/mnotvB+hYrwhMcbydNQsddxdyrx1NALWeW7vIoexWkZRSyRxTNnY1xDZG3DXDoO9dNTO+qcXyPdI42u5xLnbhYbyg2/YxhhxHFad1rthD5HHqs0hv7zmqTfCF9zofnTPspFw2NMw/BKVp9WQGqqNJe0yMEg+DEGk33X8p7lz8Ib3Og+dM+ykQQ5s/wyPG8QpKacF0cjnBwBLTYMc7iO5TsdkGEn8g/zsnpUE7PcTjwTEKSpnJbGxztRALiAWObwHep5O1vCR+cO81L91B1es7hP9BJ52T0ridjeEn8jJ5167vXdwn9Yf5qT0L6NrmE/rLvNS/dQZPKuRKLKj5JaRj2ue3S7U8uGm9+lQ74Q3ulB82Z9pIphy9n7D8xS+p6Wcvk0l2kse32I47yLKH/CGH/UoPmrPtZEGY8HAezxD5MP1vU4Ku+xXNVJll1X6sl5ISCPSdL3X0l1+aD8IKUX7V8IZ+dk90U33UG7qK9vuPNpKRlEDeSdwcR1RMN7nvcB5CunH9uFNTtIoYHzv6HSe1xDttzj3blCmPYzNj8z6mpfrkd4mgdDWjoAQe3ImGnFsRooWi95mF3yGnW791pVos045HlylmqpeDG7m8C553NaO82UZ7CMnuo2uxKdpa57dMIPHkzzpPHwHZfrWd2600lXhobDG+R3LxmzGlzraXb7DxIK/V9XNmerMkr28rPILucdMYJNhvPNaN3cArMZObh+VqSKlirKc6Rd7uVju+Q853H+QAqzMwSq/VJ/NSehcvwFVfqk/mpPQg3vbxWxV9bCYZWSgQNBLHB4B1u3GyyPg+4jDhzsQE80cOoQaeUe1l7a72ud/EKLKimfSHTKx0brXs4Fpt41xiopa2/IxPk08dDXOt32WRcqGVtQ0PY4PaRcOabtI6wV5cXxSHBon1FRII42C5cfqHWTwsteyzXR5cwakmqrxMipoi+4OsEgbrdZJAt2qBNoGep85y3deOnYfa4QeHxn9bvq6O3A7to20GbOEmlt4qZh9hHfefjv63dnR5SfVs22cTZrcJpbw0oO9/v3297H97gFj9n2EUFbLyuKVTIYWEe1ku1yO6tw3N6+lT3T7QMHpWtjjrYWNaAGtaHBoaOAA0oNkw3D48LiZBAwRxsFmtHAD09vSvWtboc94biEjIYa2N8jyA1o1XLjwA3LZEBERBi8RwOLEXiSTVqAA3G27+SsJWU4pOUY29he1+PBbetXxfnzfz0IPRFlWnJa8677jzt1/ItgXCHmt7guaAiIgKPc+7LqfMxdPARTVJ3lwF4nn47eg/GHjupCRBVPH8hYjgLiJaV7mD8pGOUi77jh47LCNw+Y8IX/AOUq46+cUFVsGyFiWMFvJUkjWn38g5OO3Xd3HxXWx5h2O1mFwtlhe2rcB7ZGwEPHyL88eQ9isMvqCn+FUklJWUokY6MiaLc4Fp5461Pm27BqjHKGGKkhdO8VDXFrd5DRG8X8pCkJzQ/iAVyQVOGRcUH6OqP8hXE5FxT9n1Hm3K2aIKlOyPibeOHVPmnn+C63ZOxFv6PqfMyehW5RBXzYrgFXhuJtfPSTQs5KQanxvay+7dchenbxg1TiGIQvgppZminYC5kb3t1cpJuuBx3gqekQVB/Fmu/UajzMnoX0ZWr3cKGpP91J6Fb1EFUsP2e4pXkBlDK2/TIOTb5X2UoZJ2NR0Dmz4k5s7xvELd8IPxyef3cO9S6iDixoYABuA4DoXJEQEREEIbb8r1uNVsMtJSyTsEDWlzBca9bzbyELJbBsv1eCOrjV08kGsQhusab213t5QpdRBpu1ymkrMJq44WOkeeSs1oLnG0zCbAb+Auq4R5Yrj+Y1HmpPQrgpZBUL8V68/mNT5qT0L5+KtefzCp8zJ6Fb6yWQVh2e5YrafEqGSSjqI2NlaXOdFI1oA6SSNys8lkQEREBa5idK+R8ulhN+C2NEHCIWA7guaIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIg//9k=";

// Function to read the summary data from lhci-summary.json file
const getSummaryData = () => {
  try {
    const data = fs.readFileSync("lhci-summary.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading lhci-summary.json:", error);
    return [];
  }
};

// Step 1: Initialize an array to store the averages
const siteDesktopAvgPerf = [];
const siteMobileAvgPerf = [];
const siteDesktopSEO = [];
const siteMobileSEO = [];
const siteMobileAccessibility = [];
const siteDesktopAccessibility = [];

/*
    const siteAvgLCP = [];
    const siteAvgFCP = [];
    const siteAvgTBT = [];
    const siteAvggCLS = []; 
    const siteAvgSpeedIndex = [];
    */

// Function to run processConfig.js
const runProcessConfig = () => {
  try {
    execSync("node processConfig.js", { stdio: "inherit" });
  } catch (error) {
    console.error("Error running processConfig.js:", error);
    process.exit(1);
  }
};

// Function to run lighthouse analysis generator
const runLighthouseAnalysis = () => {
  try {
    console.log("Generating Lighthouse analysis data...");
    execSync("node generateLighthouseAnalysis.js", { stdio: "inherit" });
    console.log("Lighthouse analysis completed successfully.");
  } catch (error) {
    console.error("Error running generateLighthouseAnalysis.js:", error);
    // Don't exit, continue with main report generation
  }
};

// Function to read the project configuration from githubconfigsFile.json
const getConfigData = () => {
  const data = fs.readFileSync("githubconfigsFile.json", "utf8");
  return JSON.parse(data);
};

// Function to read analysis data
const getAnalysisData = () => {
  try {
    const data = fs.readFileSync("lighthouse-analysis-data.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading lighthouse-analysis-data.json:", error);
    return {};
  }
};

// Function to generate HTML report with dynamic filename (date + time)
const generateFinalHTMLReport = (summaryData, configData, analysisData) => {
  // Get the current date and time for the filename
  const now = new Date();
  const dateString = now.toISOString().replace(/:/g, "-"); // Replace ":" to avoid issues in filenames
  const filename = `lighthouse-metrics-report-${dateString}.html`;

  // Function to apply color based on pass/fail
  const getPassFailColor = (score) => {
    if (score >= 0.9) return "green"; // Pass
    if (score < 0.9) return "red"; // Fail
    return "gray"; // Undefined
  };

  // Function to get percentage from performance and accessibility
  const getPercentage = (score) => {
    return (score * 100).toFixed(0) + "%";
  };

  // NEW HELPER FUNCTION: To format performance percentages with conditional styling
  const getPerformancePercentageHtml_Desktop = (score) => {
    // Adding average below :-
      if (score >= 0.9) return "#006400"; // Dark Green - Excellent
      if (score < 0.9) return "red"; // Dark Red - Poor
      return "black"; // Fallback/Undefined
    };

  // NEW HELPER FUNCTION: To format performance percentages with conditional styling
  const getPerformancePercentageHtml_Mobile = (score) => {
     // Adding average below :-
      if (score >= 0.8) return "#006400"; // Dark Green - Excellent
      if (score < 0.8) return "red"; // Dark Red - Poor
      return "black"; // Fallback/Undefined
    };

  // Group data by URL and calculate average performance and SEO separately for Desktop and Mobile
  const groupedData = summaryData.reduce((acc, entry) => {
    if (!acc[entry.url]) {
      acc[entry.url] = { desktop: [], mobile: [] };
    }
    if (entry.runType === "desktop") {
      acc[entry.url].desktop.push(entry);
    } else if (entry.runType === "mobile") {
      acc[entry.url].mobile.push(entry);
    }
    return acc;
  }, {});

  // Sort the URLs alphabetically
  const sortedUrls = Object.keys(groupedData).sort();
  let htmlContent = `
    <html>
      <head>
        <title>Lighthouse Metrics Report</title>
        <style>
          table { 
            width: 100%; 
            border-collapse: collapse; 
            overflow-y: auto; 
            display: block;
            margin-bottom: 30px;
          }
          th, td { 
            padding: 8px; 
            text-align: left; 
            border: 1px solid #ddd; 
          }
          th { 
            background-color: #f2f2f2;
            position: sticky;
            top: 0;
            z-index: 1;
          }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:nth-child(odd) { background-color: #fff; }
          .desktop { background-color: #d4edda; }
          .mobile { background-color: #f8d7da; }
          .pass { color: green; }
          .fail { color: red; }
          .highlight {
            background-color: #f0ad4e; /* Highlighted Rows (light orange) */
          }
          .average-column {
            background-color: #e9ecef; /* Light gray background for average column */
            font-weight: bold;
            color: #343a40;
            border: 2px solid black; /* Black border only for average column */
          }
          .average-row {
            border: 2px solid black; /* Black border for rows */
          }
          
          /* Analysis Table Styles */
          .analysis-table {
            margin-top: 40px;
          }
          
          .analysis-section-title {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            margin: 30px 0 0 0;
            border-radius: 8px 8px 0 0;
            font-size: 1.2rem;
            font-weight: bold;
          }
          
          /* Analysis Button Styles */
          .analysis-btn {
            background: linear-gradient(135deg, #c8a2c8, #dda0dd);
            color: black;
            font-weight: bold;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
            margin: 2px;
          }
          
          .analysis-btn:hover {
            background: #c242e0;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(194, 66, 224, 0.3);
          }
          
          .analysis-btn.error {
            background: #ffcccb;
            color: #8b0000;
            cursor: default;
          }
          
          .analysis-btn.no-data {
            background: #f0f0f0;
            color: #666;
            cursor: default;
          }
          
          /* Modal Styles */
          .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
          }
          
          .modal-content {
            background-color: #fefefe;
            margin: 2% auto;
            padding: 20px;
            border: none;
            border-radius: 10px;
            width: 90%;
            max-width: 1200px;
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }
          
          .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            line-height: 1;
          }
          
          .close:hover {
            color: #000;
          }
          
          .analysis-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            margin: -20px -20px 20px -20px;
            border-radius: 10px 10px 0 0;
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
          }
          
          .metric-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .metric-score {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .metric-label {
            font-size: 0.9rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .score-excellent { color: #00c851; }
          .score-good { color: #ffbb33; }
          .score-needs-improvement { color: #ff4444; }
          
          .issues-section {
            margin-top: 20px;
          }
          
          .issues-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 15px;
            margin: 15px 0;
          }
          
          .issue-category {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            min-height: 200px;
          }
          
          .issue-category h4 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1rem;
          }
          
          .issue-item {
            background: white;
            border-left: 4px solid #ff4444;
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 0 6px 6px 0;
            font-size: 0.9rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .issue-title {
            font-weight: bold;
            color: #d32f2f;
            margin-bottom: 4px;
          }
          
          .issue-description {
            color: #666;
            margin-bottom: 6px;
            line-height: 1.4;
            word-wrap: break-word;
            coverflow-wrap: break-word;
            hyphens: auto;
          }
          
          .issue-savings {
            background: #e3f2fd;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            color: #1976d2;
            display: inline-block;
          }
          
          .error-message {
            background: #ffebee;
            border: 1px solid #f44336;
            color: #c62828;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          
          /* Analysis Link Styles */
          .analysis-link {
            display: block;
            text-align: center;
            margin: 30px auto;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: bold;
            max-width: 300px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          
          .analysis-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            text-decoration: none;
            color: white;
          }
          
          /* Hidden analysis page */
          .analysis-page {
            display: none;
          }
          
          .back-link {
            display: inline-block;
            margin-bottom: 20px;
            padding: 10px 20px;
            background: c24262e;
            color: Black;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          
          .back-link:hover {
            background: #c242e0;
            text-decoration: none;
            color: white;
          }
          .recommendations-section {
            background: #e8f5e8;
            border-radius: 8px;
            padding: 20px;
            margin-top: 25px;
          }

          .recommendation-item {
            background: white;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin-bottom: 12px;
            border-radius: 0 8px 8px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .recommendation-title {
            font-weight: bold;
            color: #2e7d32;
            margin-bottom: 8px;
            line-height: 1.3;
          }

          .recommendation-description {
            color: #155724;
            line-height: 1.4;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <!-- Main Report Page -->
        <div id="mainReport">
          <div>
            <img src="${logo}" alt="Logo" style="float:left; width: 200px; height: 100px;">
            <p style="text-align: right;">QED42 Engineering Pvt. Ltd.</p>
            <h1 style="text-align: center;">Lighthouse Metrics Report</h1>
            
            <p><strong>Project Name:</strong> ${configData.projectName}</p>
            <p><strong>Client:</strong> ${configData.client}</p>
            <p><strong>Project Manager:</strong> ${
              configData.projectManager
            }</p>
            <p><strong>QA Manager/Lead:</strong> ${configData.qaManager}</p>
            <p><strong>Audit Date:</strong> ${
              new Date().toISOString().split("T")[0]
            }</p>
            <p><strong>Expected Time of Site Load:</strong> ${
              configData.expectedLoadTime
            }</p>
            <p><strong>Report Date:</strong> ${new Date().toISOString()}</p>

                    <!-- Container where charts will be injected -->
        <div id="lighthouse-charts"></div>
        
        <!-- Example with different metrics -->
        <div id="lighthouse-charts-2" style="margin-top: 50px;"></div>
    </div>
             <!-- Analysis Link -->
            <a href="#" class="analysis-link" onclick="showAnalysisPage(); return false;">
              📊 View Detailed Analysis Report →
            </a>
            
            <table>
              <thead>
                <tr>
                  <th style="background-color: #87CEEB; color: black; font-weight: bold;">Score Type</th>
                  <th>URL</th>
                  <th class="average-column">Performance</th>
                  <th class="average-column">SEO</th>
                  <th>Accessibility</th>
                  <th>Largest Contentful Paint</th>
                  <th>First Contentful Paint</th>
                  <th>Total Blocking Time</th>
                  <th>Cumulative Layout Shift</th>
                  <th>Speed Index</th>
                </tr>
              </thead>
              <tbody>`;

  // Loop through each URL and add rows to the table (ORIGINAL TABLE - NO CHANGES)
  sortedUrls.forEach((url) => {
    const entries = groupedData[url];

    // Calculate average performance for Desktop
    const desktopTotalPerformance = entries.desktop.reduce(
      (acc, entry) => acc + entry.categories.performance,
      0
    );
    const desktopAverage =
      entries.desktop.length > 0
        ? desktopTotalPerformance / entries.desktop.length
        : 0;

    // Calculate average performance for Mobile
    const mobileTotalPerformance = entries.mobile.reduce(
      (acc, entry) => acc + entry.categories.performance,
      0
    );

    const mobileAverage =
      entries.mobile.length > 0
        ? mobileTotalPerformance / entries.mobile.length
        : 0;

    // Calculate average SEO for Desktop
    const desktopTotalSEO = entries.desktop.reduce(
      (acc, entry) => acc + entry.categories.seo,
      0
    );
    const desktopSEO =
      entries.desktop.length > 0 ? desktopTotalSEO / entries.desktop.length : 0;

    // Calculate average SEO for Mobile
    const mobileTotalSEO = entries.mobile.reduce(
      (acc, entry) => acc + entry.categories.seo,
      0
    );
    const mobileSEO =
      entries.mobile.length > 0 ? mobileTotalSEO / entries.mobile.length : 0;

    // Calculate average accessibility for Desktop
    const desktopTotalAccessibility = entries.desktop.reduce(
      (acc, entry) => acc + entry.categories.accessibility,
      0
    );
    const desktopAccessibility =
      entries.desktop.length > 0
        ? desktopTotalAccessibility / entries.desktop.length
        : 0;

    // Calculate average accessibility for Mobile
    const mobileTotalAccessibility = entries.mobile.reduce(
      (acc, entry) => acc + entry.categories.accessibility,
      0
    );
    const mobileAccessibility =
      entries.mobile.length > 0
        ? mobileTotalAccessibility / entries.mobile.length
        : 0;

    // Calculate average audits for Desktop
    const calculateDesktopAverageAudit = (auditName) => {
      const total = entries.desktop.reduce((acc, entry) => {
        const value = parseFloat(
          entry.audits[auditName].replace(/[^\d.]/g, "")
        );
        return acc + (isNaN(value) ? 0 : value);
      }, 0);
      return entries.desktop.length > 0
        ? (total / entries.desktop.length).toFixed(1)
        : "0";
    };

    // Calculate average audits for Mobile
    const calculateMobileAverageAudit = (auditName) => {
      const total = entries.mobile.reduce((acc, entry) => {
        const value = parseFloat(
          entry.audits[auditName].replace(/[^\d.]/g, "")
        );
        return acc + (isNaN(value) ? 0 : value);
      }, 0);
      return entries.mobile.length > 0
        ? (total / entries.mobile.length).toFixed(1)
        : "0";
    };
    // see for from this point to below and debug and updage

    // Step 2: call a function to simulate desktopAverage
    // Simulate n number of entries

    siteDesktopAvgPerf.push(desktopAverage);

    siteMobileAvgPerf.push(mobileAverage);

    siteDesktopSEO.push(desktopSEO);

    siteMobileSEO.push(mobileSEO);

    siteMobileAccessibility.push(mobileAccessibility);
    siteDesktopAccessibility.push(desktopAccessibility);

    // below code works fine.
    // Add ONE row for Desktop (if desktop data exists);

    if (entries.desktop.length > 0) {
      const performanceColor =
        getPerformancePercentageHtml_Desktop(desktopAverage);
      const seoColor = getPassFailColor(desktopSEO);
      const accessibilityColor = getPassFailColor(desktopAccessibility);

      htmlContent += `
        <tr class="desktop highlight average-row">
          <td style="color: #800080; font-weight: bold;">Desktop</td>
          <td>${url}</td>
          <td class="average-column" style="color: ${performanceColor};">${getPercentage(
        desktopAverage
      )}</td>
          <td class="average-column" style="color: ${seoColor};">${getPercentage(
        desktopSEO
      )}</td>
          <td style="color: ${accessibilityColor};">${getPercentage(
        desktopAccessibility
      )}</td>
          <td>${calculateDesktopAverageAudit("largestContentfulPaint")} s</td>
          <td>${calculateDesktopAverageAudit("firstContentfulPaint")} s</td>
          <td>${calculateDesktopAverageAudit("totalBlockingTime")} ms</td>
          <td>0.10</td>
          <td>${calculateDesktopAverageAudit("speedIndex")} s</td>
        </tr>`;
    }

    // Add ONE row for Mobile (if mobile data exists)
    if (entries.mobile.length > 0) {
      const performanceColor =
        getPerformancePercentageHtml_Mobile(mobileAverage);
      const seoColor = getPassFailColor(mobileSEO);
      const accessibilityColor = getPassFailColor(mobileAccessibility);

      htmlContent += `
        <tr class="mobile highlight average-row">
         <td style="color: #1976D2; font-weight: bold;">Mobile</td>
          <td>${url}</td>
          <td class="average-column" style="color: ${performanceColor};">${getPercentage(
        mobileAverage
      )}</td>
          <td class="average-column" style="color: ${seoColor};">${getPercentage(
        mobileSEO
      )}</td>
          <td style="color: ${accessibilityColor};">${getPercentage(
        mobileAccessibility
      )}</td>
          <td>${calculateMobileAverageAudit("largestContentfulPaint")} s</td>
          <td>${calculateMobileAverageAudit("firstContentfulPaint")} s</td>
          <td>${calculateMobileAverageAudit("totalBlockingTime")} ms</td>
          <td>0.10</td>
          <td>${calculateMobileAverageAudit("speedIndex")} s</td>
        </tr>`;
    }
  });

  // fn to get avg of averages :-
  // new logic for over all site perofrmance.
  const siteTotalAvgFromAvgTotal = (itsFor, avgOfAvg) => {
    console.log("its for " + itsFor);
    const total = avgOfAvg.reduce((acc, curr) => acc + curr, 0);
    console.log("length is = " + avgOfAvg.length);
    let avg = avgOfAvg.length > 0 ? total / avgOfAvg.length : 0;
    return avg;
  };

  const avgPerformanceDesktop = siteTotalAvgFromAvgTotal(
    "desktop performance",
    siteDesktopAvgPerf
  );

  console.log("avg perf desktop " + avgPerformanceDesktop);

  const avgPerformanceMobile = siteTotalAvgFromAvgTotal(
    "mobile performance",
    siteMobileAvgPerf
  );

  console.log("avg perf Mobile " + avgPerformanceMobile);

  // get avg of avg
  const avgAllSite_DesktopSEO = siteTotalAvgFromAvgTotal(
    "mobile",
    siteDesktopSEO
  );

  const avgAllSite_MobileSEO = siteTotalAvgFromAvgTotal(
    "mobile",
    siteMobileSEO
  );

  console.log(
    "SEO m and d " + avgAllSite_MobileSEO + " " + avgAllSite_DesktopSEO
  );

  // get avg of avg
  const avgAllSite_DesktopAccessibility = siteTotalAvgFromAvgTotal(
    "desktop accessibility",
    siteDesktopAccessibility
  );

  const avgAllSite_MobileAccessibility = siteTotalAvgFromAvgTotal(
    "mobile accessibility",
    siteMobileAccessibility
  );
  console.log(
    "Accessibility m and d " +
      avgAllSite_MobileAccessibility +
      " " +
      avgAllSite_DesktopAccessibility
  );

  // Adding average below :-
  const getAverageColor = (score) => {
    if (score >= 0.9) return "#006400"; // Dark Green - Excellent
    if (score >= 0.5) return "#b8860b"; // Dark Yellow (GoldenRod) - Needs Improvement
    if (score < 0.5) return "#8b0000"; // Dark Red - Poor
    return "black"; // Fallback/Undefined
  };

  htmlContent += `
  <tr>
    <td colspan="3" style="color: #800080; font-weight: bold; border: 2px solid black;">Total site average Performance for Desktop 🖥️ </font></td>
    <td class="average-column" style="color: ${getPerformancePercentageHtml_Desktop(
      avgPerformanceDesktop
    )};">${getPercentage(avgPerformanceDesktop)} </td>
</tr>
<tr>
    <td colspan="3" style="color: #1976D2; font-weight: bold; border: 2px solid black;">Total site average Performance for Mobile 📱</font></td>
    <td class="average-column" style="color: ${getPerformancePercentageHtml_Mobile(
      avgPerformanceMobile
    )};">${getPercentage(avgPerformanceMobile)} </td>
</tr>
<tr>
    <td colspan="3" style="color: #800080; font-weight: bold; border: 2px solid black;">Total site average SEO for Desktop 🖥️ </font></td>
    <td class="average-column" style="color: ${getAverageColor(
      avgAllSite_DesktopSEO
    )};">${getPercentage(avgAllSite_DesktopSEO)} </td>
</tr>
<tr>
    <td colspan="3" style="color: #1976D2; font-weight: bold; border: 2px solid black;">Total site average SEO for Mobile 📱</font></td>
    <td class="average-column" style="color: ${getAverageColor(
      avgAllSite_MobileSEO
    )};">${getPercentage(avgAllSite_MobileSEO)}</td>
</tr>
<tr>
    <td colspan="3" style="color: #800080; font-weight: bold; border: 2px solid black;">Total site average Accessibility for Desktop 🖥️ </font></td>
    <td class="average-column" style="color: ${getAverageColor(
      avgAllSite_DesktopAccessibility
    )};">${getPercentage(avgAllSite_DesktopAccessibility)} </td>
</tr>
<tr>
    <td colspan="3" style="color: #1976D2; font-weight: bold; border: 2px solid black;">Total site average Accessibility for Mobile 📱</font></td>
    <td class="average-column" style="color: ${getAverageColor(
      avgAllSite_MobileAccessibility
    )};">${getPercentage(avgAllSite_MobileAccessibility)} </td>
</tr>
`;

  // Generate analysis rows for the separate table
  const generateAnalysisTableRows = () => {
    let analysisRows = "";
    const analysisKeys = Object.keys(analysisData);

    if (analysisKeys.length === 0) {
      return `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px; color: #666;">
            No analysis data available. Make sure generateLighthouseAnalysis.js has been run successfully.
          </td>
        </tr>
      `;
    }

    analysisKeys.forEach((analysisKey) => {
      const [url, deviceType] = analysisKey.split("_");
      const data = analysisData[analysisKey];

      let buttonHtml = "";
      if (data.error) {
        buttonHtml = `<button class="analysis-btn error" title="Error: ${data.error}">Analysis Failed ❌</button>`;
      } else {
        buttonHtml = `<button class="analysis-btn" onclick="showAnalysis('${analysisKey}')">View Analysis 📊</button>`;
      }

      const deviceIcon = deviceType === "desktop" ? "💻" : "📱";
      const deviceLabel =
        deviceType.charAt(0).toUpperCase() + deviceType.slice(1);

      analysisRows += `
        <tr>
          <td>${url}</td>
          <td>${deviceLabel} ${deviceIcon}</td>
          <td style="text-align: center;">${buttonHtml}</td>
        </tr>
      `;
    });

    return analysisRows;
  };

  // Continue building HTML with analysis link and hidden analysis page
  htmlContent += `
              </tbody>
            </table>
            
            <!-- Analysis Link -->
            <a href="#" class="analysis-link" onclick="showAnalysisPage(); return false;">
              📊 View Detailed Analysis Report →
            </a>
          </div>
        </div>
        
        <!-- Analysis Page (Hidden by default) -->
        <div id="analysisPage" class="analysis-page">
          <a href="#" class="back-link" onclick="showMainReport(); return false;">
            ← Back to Main Report
          </a>
          
          <div class="analysis-section-title">
            📊 Lighthouse Detailed Analysis
          </div>
          
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Run Type</th>
                <th>Analysis</th>
              </tr>
            </thead>
            <tbody>
              ${generateAnalysisTableRows()}
            </tbody>
          </table>
        </div>
        
        <!-- Analysis Modal -->
        <div id="analysisModal" class="modal">
          <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <div id="analysisContent">
              <!-- Analysis content will be loaded here -->
            </div>
          </div>
        </div>

        <script>
          // Analysis data embedded in the HTML
          const analysisData = ${JSON.stringify(analysisData, null, 2)};
          
          // Page navigation functions
          function showAnalysisPage() {
            document.getElementById('mainReport').style.display = 'none';
            document.getElementById('analysisPage').style.display = 'block';
            window.scrollTo(0, 0);
          }
          
          function showMainReport() {
            document.getElementById('mainReport').style.display = 'block';
            document.getElementById('analysisPage').style.display = 'none';
            window.scrollTo(0, 0);
          }
          
          function showAnalysis(analysisKey) {
            const modal = document.getElementById('analysisModal');
            const content = document.getElementById('analysisContent');
            const data = analysisData[analysisKey];
            
            if (!data || data.error) {
              content.innerHTML = \`
                <div class="analysis-header">
                  <h2>❌ Analysis Error</h2>
                </div>
                <div class="error-message">
                  \${data ? data.error : 'No analysis data available for this URL and device type.'}
                </div>
              \`;
              modal.style.display = 'block';
              return;
            }
            
            const [url, deviceType] = analysisKey.split('_');
            
            content.innerHTML = \`
              <div class="analysis-header">
                <h2>📊 Lighthouse Analysis</h2>
                <h4><strong>URL:</strong> \${url}</h4>
                <p><strong>Note:</strong> 👩🏻‍💻 For Detailed issues explaination and best practices purpose, Please open above url in chrome lighthouse and generate report.</p>
                <p><strong>Device:</strong> \${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} \${deviceType === 'desktop' ? '💻' : '📱'}</p>
              </div>
              
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-score \${getScoreClass(data.metrics.performance)}">\${data.metrics.performance}</div>
                  <div class="metric-label">Performance</div>
                </div>
                <div class="metric-card">
                  <div class="metric-score \${getScoreClass(data.metrics.accessibility)}">\${data.metrics.accessibility}</div>
                  <div class="metric-label">Accessibility</div>
                </div>
                <div class="metric-card">
                  <div class="metric-score \${getScoreClass(data.metrics.bestPractices)}">\${data.metrics.bestPractices}</div>
                  <div class="metric-label">Best Practices</div>
                </div>
                <div class="metric-card">
                  <div class="metric-score \${getScoreClass(data.metrics.seo)}">\${data.metrics.seo}</div>
                  <div class="metric-label">SEO</div>
                </div>
              </div>
              
              <div class="issues-section">
                <h3>🔍 Issues Found</h3>
                <div class="issues-grid">
                  \${renderIssuesCategory('Performance Issues', data.issues.performance)}
                  \${renderIssuesCategory('Accessibility Issues', data.issues.accessibility)}
                  \${renderIssuesCategory('Best Practices Issues', data.issues.bestPractices)}
                  \${renderIssuesCategory('SEO Issues', data.issues.seo)}
                </div>
                
                <div class="recommendations-section">
                  <h4 style="color: #2e7d32; margin-bottom: 10px;">💡 Recommendations</h4>
                  \${data.recommendations.map(rec => \`
                    <div style="background: white; border-left: 4px solid #4caf50; padding: 10px; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
                      <strong>\${rec.title}</strong><br>
                      \${rec.description}
                    </div>
                  \`).join('')}
                </div>
              </div>
            \`;
            
            modal.style.display = 'block';
          }
          
          function getScoreClass(score) {
            if (score >= 90) return 'score-excellent';
            if (score >= 50) return 'score-good';
            return 'score-needs-improvement';
          }
          
          function renderIssuesCategory(title, issues) {
            if (!issues || issues.length === 0) {
              return \`
                <div class="issue-category">
                  <h4>\${title}</h4>
                  <p style="color: #4caf50; font-style: italic;">✅ No issues found</p>
                </div>
              \`;
            }
            
            const issueItems = issues.slice(0, 5).map(issue => \`
              <div class="issue-item">
                <div class="issue-title">\${issue.title}</div>
                <div class="issue-description">\${issue.description}</div>
                \${issue.savings ? \`<div class="issue-savings">Potential savings: \${issue.savings}</div>\` : ''}
              </div>
            \`).join('');
            
            const moreText = issues.length > 5 ? \`<p style="margin-top: 8px; color: #666; font-size: 0.9rem;"><em>...and \${issues.length - 5} more issues</em></p>\` : '';
            
            return \`
              <div class="issue-category">
                <h4>\${title} (\${issues.length})</h4>
                \${issueItems}
                \${moreText}
              </div>
            \`;
          }
          
          function closeModal() {
            document.getElementById('analysisModal').style.display = 'none';
          }
          
          // Close modal when clicking outside of it
          window.onclick = function(event) {
            const modal = document.getElementById('analysisModal');
            if (event.target === modal) {
              modal.style.display = 'none';
            }
          }
        </script>
      </body>
    </html>`;

  // Save the generated report as an HTML file
  fs.writeFileSync(filename, htmlContent);
  console.log(`Enhanced report with analysis saved as ${filename}`);
};

// Main execution block - make sure it's an async function to use await
async function main() {
  // <-- Added 'async' here
  console.log("Starting enhanced Lighthouse report generation...");

  // Run process config
  runProcessConfig();

  // Run lighthouse analysis generation
  runLighthouseAnalysis();

  // Get all data
  const summaryData = getSummaryData();
  const configData = getConfigData();
  const analysisData = getAnalysisData();

  // Generate HTML report (your existing function call)
  // Make sure generateFinalHTMLReport is also async if it performs async operations
  // If generateFinalHTMLReport also creates a PDF, you might want to remove that logic
  // from it to avoid duplicate PDF generation, as generatePdfReportFromData handles it.
  generateFinalHTMLReport(summaryData, configData, analysisData);
  (" ✅✅✅ 📁📁 HTML REPORT Enhanced Lighthouse htm  report generation completed! 📁 ✅✅✅");

  // Call the PDF generation function
  // Pass the collected data to it

  await generatePdfReportFromData(logo, summaryData, configData, analysisData); // 

  console.log(
    " ✅✅✅ 📄 PDF Enhanced Lighthouse PDF  report generation completed! 📄📄📄 ✅✅✅"
  ); 
}

// Call the async main function
main().catch(error => {
    console.error("An error occurred during report generation:", error);
});
