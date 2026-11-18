import fs from "fs";
import path from "path";

export function renderDashboardHtml(): string {
  const htmlPath = path.join(__dirname, "dashboard.html");
  if (fs.existsSync(htmlPath)) {
    return fs.readFileSync(htmlPath, "utf-8");
  }
  const fallbackPath = path.join(process.cwd(), "src", "views", "dashboard.html");
  if (fs.existsSync(fallbackPath)) {
    return fs.readFileSync(fallbackPath, "utf-8");
  }
  return "<!DOCTYPE html><html><body><h1>GUARDTECK DISPATCH CONSOLE</h1></body></html>";
}
