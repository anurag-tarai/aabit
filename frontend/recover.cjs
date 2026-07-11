const fs = require('fs');
const readline = require('readline');

async function recover() {
  const fileStream = fs.createReadStream('/home/anurag/.gemini/antigravity/brain/8a886797-d3f9-445c-9cab-c0e94e0b0375/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let bestContent = null;
  let maxTime = "";

  for await (const line of rl) {
    if (!line.includes('SprintDashboard.tsx')) continue;
    try {
      const obj = JSON.parse(line);
      // Check if it's a view_file response
      if (obj.type === 'TOOL_RESPONSE' && obj.tool_calls && obj.tool_calls.length > 0) {
        // Unfortunately view_file response is in text, but let's check for replace_file_content request
      }
      if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content') {
            if (tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('SprintDashboard.tsx')) {
              console.log("Found edit at", obj.created_at);
            }
          }
        }
      }
    } catch (e) {}
  }
}
recover();
