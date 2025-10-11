#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const SEVERITY_RANK = ['critical', 'high', 'medium', 'low'];
const SLA_MATRIX = {
  critical: { hours: 24, escalation: 'PagerDuty on-call + Exec Slack escalation within 30 minutes.' },
  high: { hours: 48, escalation: 'Squad lead paged and QA lead review within 4 hours.' },
  medium: { hours: 120, escalation: 'Prioritise in next triage cycle; QA to verify fix before merge.' },
  low: { hours: 240, escalation: 'Schedule in backlog grooming; monitor for duplicates.' }
};

function extractJsonBlock(markdown) {
  const startMarker = '<!-- intake:start -->';
  const endMarker = '<!-- intake:end -->';
  const startIndex = markdown.indexOf(startMarker);
  const endIndex = markdown.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('Unable to locate intake markers in issue_report.md');
  }
  const jsonStart = markdown.indexOf('```json', startIndex);
  if (jsonStart === -1) {
    throw new Error('Unable to locate JSON block inside intake markers');
  }
  const blockStart = jsonStart + '```json'.length;
  const blockEnd = markdown.indexOf('```', blockStart);
  if (blockEnd === -1 || blockEnd > endIndex) {
    throw new Error('Unable to locate closing fence for JSON block');
  }
  const jsonText = markdown.slice(blockStart, blockEnd).trim();
  return { jsonText, blockStart, blockEnd, startIndex, endIndex };
}

function validateIssues(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Parsed intake payload is not an object');
  }
  if (!Array.isArray(data.issues)) {
    throw new Error('`issues` must be an array in issue_report payload');
  }
  const seen = new Set();
  data.issues.forEach((issue, index) => {
    const context = `Issue at index ${index}`;
    if (!issue.id || typeof issue.id !== 'string') {
      throw new Error(`${context} is missing a string id`);
    }
    if (seen.has(issue.id)) {
      throw new Error(`Duplicate issue id detected: ${issue.id}`);
    }
    seen.add(issue.id);
    if (!issue.title) {
      throw new Error(`${context} (${issue.id}) is missing a title`);
    }
    const severity = issue.severity?.toLowerCase();
    if (!SEVERITY_RANK.includes(severity)) {
      throw new Error(`${context} (${issue.id}) has invalid severity: ${issue.severity}`);
    }
    if (!issue.reportedAt) {
      throw new Error(`${context} (${issue.id}) is missing reportedAt`);
    }
    if (Number.isNaN(Date.parse(issue.reportedAt))) {
      throw new Error(`${context} (${issue.id}) has invalid reportedAt date`);
    }
    if (!issue.status) {
      throw new Error(`${context} (${issue.id}) is missing status`);
    }
  });
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date) {
  const iso = date.toISOString();
  return iso.replace('T', ' ').replace('Z', ' UTC');
}

function formatAge(from, to) {
  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
  const minutes = totalMinutes - days * 24 * 60 - hours * 60;
  const segments = [];
  if (days) segments.push(`${days}d`);
  if (hours) segments.push(`${hours}h`);
  if (minutes && segments.length < 2) segments.push(`${minutes}m`);
  return segments.length ? segments.join(' ') : '0m';
}

function computeDerivedFields(issue, now) {
  const severity = issue.severity.toLowerCase();
  const sla = SLA_MATRIX[severity];
  const reportedAt = new Date(issue.reportedAt);
  const dueAt = new Date(reportedAt.getTime() + sla.hours * 3600000);
  const overdue = dueAt.getTime() < now.getTime();
  const primaryEvidence = Array.isArray(issue.evidence) && issue.evidence.length > 0 ? issue.evidence[0] : null;
  return { severity, sla, reportedAt, dueAt, overdue, primaryEvidence };
}

function buildSummary(issues, now) {
  const totals = {
    overall: issues.length,
    bySeverity: Object.fromEntries(SEVERITY_RANK.map(key => [key, 0])),
    overdue: 0
  };
  issues.forEach(issue => {
    const derived = computeDerivedFields(issue, now);
    totals.bySeverity[derived.severity] += 1;
    if (derived.overdue) totals.overdue += 1;
  });
  return totals;
}

function buildIssueListMarkdown(issues, metadata, now) {
  const totals = buildSummary(issues, now);
  const headerLines = [];
  headerLines.push('# Issue List — Version 1.00');
  headerLines.push(`_Last updated: ${formatDateTime(now)}_`);
  headerLines.push('');
  headerLines.push('## SLA Policy');
  headerLines.push('| Severity | SLA | Escalation |');
  headerLines.push('| --- | --- | --- |');
  SEVERITY_RANK.forEach(level => {
    const sla = SLA_MATRIX[level];
    headerLines.push(`| ${level.charAt(0).toUpperCase() + level.slice(1)} | ${sla.hours}h | ${sla.escalation} |`);
  });
  headerLines.push('');
  headerLines.push('## Intake Summary');
  headerLines.push(`- **Total open issues:** ${totals.overall}`);
  headerLines.push(`- **Overdue vs SLA:** ${totals.overdue}`);
  headerLines.push(`- **Critical:** ${totals.bySeverity.critical} | **High:** ${totals.bySeverity.high} | **Medium:** ${totals.bySeverity.medium} | **Low:** ${totals.bySeverity.low}`);
  if (metadata?.notes) {
    headerLines.push(`- **Notes:** ${metadata.notes}`);
  }
  headerLines.push('');
  headerLines.push('| ID | Title | Severity | Status | Owner | Reported | SLA Due | Age | Source |');
  headerLines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');

  const sorted = [...issues].sort((a, b) => {
    const rankDiff = SEVERITY_RANK.indexOf(a.severity.toLowerCase()) - SEVERITY_RANK.indexOf(b.severity.toLowerCase());
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
  });

  sorted.forEach(issue => {
    const derived = computeDerivedFields(issue, now);
    const owner = issue.owner ?? issue.squad ?? 'Unassigned';
    const source = derived.primaryEvidence?.value ?? issue.component ?? 'n/a';
    const age = formatAge(derived.reportedAt, now);
    const due = `${formatDate(derived.dueAt)}${derived.overdue ? ' ⚠️' : ''}`;
    headerLines.push(`| ${issue.id} | ${issue.title.replace(/\|/g, '\\|')} | ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)} | ${issue.status} | ${owner.replace(/\|/g, '\\|')} | ${formatDate(derived.reportedAt)} | ${due} | ${age} | ${source.replace(/\|/g, '\\|')} |`);
  });

  headerLines.push('');
  headerLines.push('> Generated via `scripts/issue-intake.mjs`. Do not edit this file manually; update `issue_report.md` instead.');
  headerLines.push('');
  return headerLines.join('\n');
}

function buildFixSuggestionsMarkdown(issues, now) {
  const lines = [];
  lines.push('# Fix Suggestions — Version 1.00');
  lines.push(`_Generated: ${formatDateTime(now)}_`);
  lines.push('');
  const sorted = [...issues].sort((a, b) => {
    const rankDiff = SEVERITY_RANK.indexOf(a.severity.toLowerCase()) - SEVERITY_RANK.indexOf(b.severity.toLowerCase());
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
  });

  sorted.forEach(issue => {
    const derived = computeDerivedFields(issue, now);
    const owner = issue.owner ?? issue.squad ?? 'Unassigned';
    lines.push(`## ${issue.id} — ${issue.title}`);
    lines.push(`- **Severity:** ${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)} (${derived.sla.hours}h SLA)`);
    lines.push(`- **Status:** ${issue.status} — Reported ${formatDate(derived.reportedAt)} (${formatAge(derived.reportedAt, now)} ago); SLA due ${formatDateTime(derived.dueAt)}${derived.overdue ? ' ⚠️ Overdue' : ''}`);
    lines.push(`- **Squad / Owner:** ${owner}`);
    lines.push(`- **Environment:** ${issue.environment ?? 'unspecified'}`);
    if (issue.impact) {
      lines.push(`- **Impact:** ${issue.impact}`);
    }
    if (issue.description) {
      lines.push(`- **Problem Statement:** ${issue.description}`);
    }
    if (Array.isArray(issue.reproduction) && issue.reproduction.length) {
      lines.push('');
      lines.push('### Reproduction Steps');
      issue.reproduction.forEach((step, idx) => {
        lines.push(`${idx + 1}. ${step}`);
      });
    }
    if (Array.isArray(issue.recommendedFix) && issue.recommendedFix.length) {
      lines.push('');
      lines.push('### Recommended Remediation Actions');
      issue.recommendedFix.forEach(action => {
        lines.push(`- ${action}`);
      });
    }
    if (Array.isArray(issue.acceptanceCriteria) && issue.acceptanceCriteria.length) {
      lines.push('');
      lines.push('### Acceptance Criteria');
      issue.acceptanceCriteria.forEach(criteria => {
        lines.push(`- [ ] ${criteria}`);
      });
    }
    if (Array.isArray(issue.dependencies) && issue.dependencies.length) {
      lines.push('');
      lines.push('### Dependencies & Notes');
      issue.dependencies.forEach(dep => {
        lines.push(`- ${dep}`);
      });
    }
    if (Array.isArray(issue.evidence) && issue.evidence.length) {
      lines.push('');
      lines.push('### Evidence');
      issue.evidence.forEach(item => {
        lines.push(`- **${item.type ?? 'reference'}:** ${item.value}${item.details ? ` — ${item.details}` : ''}`);
      });
    }
    lines.push('');
  });
  lines.push('> Generated via `scripts/issue-intake.mjs`. Update `issue_report.md` and re-run the script to refresh.');
  lines.push('');
  return lines.join('\n');
}

function updateReportMarkdown(markdown, data, blockInfo, now) {
  const updatedData = { ...data, metadata: { ...(data.metadata ?? {}), lastProcessedAt: now.toISOString() } };
  const updatedJson = JSON.stringify(updatedData, null, 2);
  return markdown.slice(0, blockInfo.blockStart) + '\n' + updatedJson + '\n' + markdown.slice(blockInfo.blockEnd);
}

async function main() {
  const reportPath = path.join(repoRoot, 'update_docs/1.00/pre-update_evaluations/issue_report.md');
  const issueListPath = path.join(repoRoot, 'update_docs/1.00/pre-update_evaluations/issue_list.md');
  const suggestionsPath = path.join(repoRoot, 'update_docs/1.00/pre-update_evaluations/fix_suggestions.md');

  const reportContent = await readFile(reportPath, 'utf8');
  const blockInfo = extractJsonBlock(reportContent);
  const data = JSON.parse(blockInfo.jsonText);
  validateIssues(data);
  const now = new Date();

  const issueListMarkdown = buildIssueListMarkdown(data.issues, data.metadata, now);
  const fixSuggestionsMarkdown = buildFixSuggestionsMarkdown(data.issues, now);
  const updatedReportMarkdown = updateReportMarkdown(reportContent, data, blockInfo, now);

  await Promise.all([
    writeFile(issueListPath, issueListMarkdown + '\n'),
    writeFile(suggestionsPath, fixSuggestionsMarkdown + '\n'),
    writeFile(reportPath, updatedReportMarkdown)
  ]);
}

main().catch(error => {
  console.error('\nIssue intake automation failed:', error.message);
  process.exitCode = 1;
});
