const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/okeeffed/codemod-tsoa-401-403/main/checkAndAddDecorators.ts";
const SCRIPT_NAME = "checkAndAddDecorators.ts";

// Download the script from GitHub
function downloadScript(url, fileName) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const file = fs.createWriteStream(fileName);
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        } else {
          reject(`Failed to download script: ${response.statusCode}`);
        }
      })
      .on("error", (err) => {
        reject(`Error: ${err.message}`);
      });
  });
}

// Find all controller files
function findControllerFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!["node_modules", ".git", "dist", "build"].includes(file)) {
        findControllerFiles(filePath, fileList);
      }
    } else if (file.endsWith(".controller.ts")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

async function main() {
  try {
    // Download the script
    await downloadScript(GITHUB_RAW_URL, SCRIPT_NAME);
    console.log("Script downloaded successfully");

    // Find all controller files
    const controllerFiles = findControllerFiles(process.cwd());
    console.log(`Found ${controllerFiles.length} controller files`);

    // Run the script
    const command = `npx tsx ${SCRIPT_NAME} ${controllerFiles.join(" ")}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
      }
      console.log(stdout);

      // Clean up - delete the downloaded script
      fs.unlinkSync(SCRIPT_NAME);
      console.log("Script cleaned up");
    });
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}

main();
