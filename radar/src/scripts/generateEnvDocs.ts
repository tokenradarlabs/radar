import * as fs from 'fs';
import * as path from 'path';

const envValidationPath = path.resolve(__dirname, '../../utils/envValidation.ts');
const outputPath = path.resolve(__dirname, '../../../docs/ENVIRONMENT_VARIABLES.md');

function generateEnvDocs() {
  const content = fs.readFileSync(envValidationPath, 'utf-8');

  const envVariables: { name: string; type: string; required: boolean; description: string }[] = [];

  const requiredEnvVarsRegex = /interface RequiredEnvVars {([\s\S]*?)}/;
  const requiredMatch = content.match(requiredEnvVarsRegex);
  if (requiredMatch && requiredMatch[1]) {
    requiredMatch[1].split('\n').forEach(line => {
      const varMatch = line.match(/^\s*([a-zA-Z_]+):\s*([^;]+);/);
      if (varMatch) {
        envVariables.push({ name: varMatch[1], type: varMatch[2].trim(), required: true, description: '' });
      }
    });
  }

  const optionalEnvVarsRegex = /interface OptionalEnvVars {([\s\S]*?)}/;
  const optionalMatch = content.match(optionalEnvVarsRegex);
  if (optionalMatch && optionalMatch[1]) {
    optionalMatch[1].split('\n').forEach(line => {
      const varMatch = line.match(/^\s*([a-zA-Z_]+)\?:\s*([^;]+);/);
      if (varMatch) {
        envVariables.push({ name: varMatch[1], type: varMatch[2].trim(), required: false, description: '' });
      }
    });
  }

  // Sort variables alphabetically for consistent documentation
  envVariables.sort((a, b) => a.name.localeCompare(b.name));

  let markdownContent = '# Environment Variables\n\n';
  markdownContent += 'This document lists all environment variables used by the application, their types, and whether they are required.\n\n';
  markdownContent += '| Variable Name | Type | Required | Description |\n';
  markdownContent += '|---------------|------|----------|-------------|\n';

  for (const envVar of envVariables) {
    markdownContent += `| ${envVar.name} | ${envVar.type} | ${envVar.required ? 'Yes' : 'No'} | ${envVar.description} |\n`;
  }

  fs.writeFileSync(outputPath, markdownContent, 'utf-8');
  console.log(`Environment variable documentation generated at ${outputPath}`);
}

generateEnvDocs();