import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkflowReport } from "../schemas/report.js";
import type { TraceSummary } from "../schemas/trace.js";

export interface InputDocument {
  path: string;
  content: string;
}

export interface SavedArtifacts {
  reportPath: string;
  tracePath: string;
}

export async function readInputDocument(inputPath: string): Promise<InputDocument> {
  const content = await readFile(inputPath, "utf8");
  return {
    path: inputPath,
    content
  };
}

export async function saveRunArtifacts(
  outputDir: string,
  report: WorkflowReport,
  trace: TraceSummary
): Promise<SavedArtifacts> {
  const reportsDir = path.join(outputDir, "reports");
  const tracesDir = path.join(outputDir, "traces");
  await mkdir(reportsDir, { recursive: true });
  await mkdir(tracesDir, { recursive: true });

  const reportPath = path.join(reportsDir, `${trace.runId}.md`);
  const tracePath = path.join(tracesDir, `${trace.runId}.json`);
  const traceWithPaths = {
    ...trace,
    reportPath,
    tracePath
  };

  await writeFile(reportPath, report.markdown, "utf8");
  await writeFile(tracePath, `${JSON.stringify(traceWithPaths, null, 2)}\n`, "utf8");

  return { reportPath, tracePath };
}
