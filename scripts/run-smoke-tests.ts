/**
 * Smoke Test Runner Script
 * 
 * Runs smoke tests against a deployed environment to verify
 * critical functionality after deployment.
 * 
 * Usage:
 *   npx tsx scripts/run-smoke-tests.ts [environment-url]
 * 
 * Examples:
 *   npx tsx scripts/run-smoke-tests.ts https://staging.findam.com
 *   npx tsx scripts/run-smoke-tests.ts https://findam.com
 * 
 * Requirements: 33.9
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SmokeTestResult {
  success: boolean;
  duration: number;
  errors: string[];
  output: string;
}

async function runSmokeTests(baseUrl?: string): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  console.log('🚀 Starting smoke tests...');
  console.log(`🌐 Target URL: ${baseUrl || 'http://localhost:3000'}`);
  console.log('');

  try {
    // Build the playwright command
    const env = baseUrl ? `BASE_URL=${baseUrl}` : '';
    const command = `${env} npx playwright test e2e/smoke.spec.ts --reporter=line`;

    console.log(`📋 Running: ${command}`);
    console.log('');

    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        ...(baseUrl ? { BASE_URL: baseUrl } : {}),
      },
    });

    const duration = Date.now() - startTime;

    console.log(stdout);
    if (stderr) {
      console.error('⚠️  Warnings:', stderr);
    }

    console.log('');
    console.log('✅ Smoke tests passed!');
    console.log(`⏱️  Duration: ${duration}ms`);

    return {
      success: true,
      duration,
      errors: [],
      output: stdout,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof Error) {
      const execError = error as any;
      console.error('❌ Smoke tests failed!');
      console.error('');
      console.error(execError.stdout || execError.message);
      if (execError.stderr) {
        console.error('Errors:', execError.stderr);
      }

      errors.push(execError.message);
      
      return {
        success: false,
        duration,
        errors,
        output: execError.stdout || execError.message,
      };
    }

    throw error;
  }
}

async function sendAlertOnFailure(result: SmokeTestResult, environment: string) {
  // In production, integrate with alerting service (Slack, PagerDuty, etc.)
  console.error('');
  console.error('🚨 ALERT: Smoke tests failed in', environment);
  console.error('Errors:', result.errors);
  console.error('');
  console.error('Please investigate immediately!');
  
  // Example: Send to Slack webhook
  // await fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `🚨 Smoke tests failed in ${environment}`,
  //     blocks: [
  //       {
  //         type: 'section',
  //         text: {
  //           type: 'mrkdwn',
  //           text: `*Smoke Test Failure*\n\nEnvironment: ${environment}\nDuration: ${result.duration}ms\n\nErrors:\n${result.errors.join('\n')}`,
  //         },
  //       },
  //     ],
  //   }),
  // });
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0];
  const environment = baseUrl ? new URL(baseUrl).hostname : 'local';

  console.log('╔════════════════════════════════════════╗');
  console.log('║   FindAm Smoke Test Runner             ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  const result = await runSmokeTests(baseUrl);

  if (!result.success) {
    await sendAlertOnFailure(result, environment);
    process.exit(1);
  }

  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   All smoke tests passed! 🎉           ║');
  console.log('╚════════════════════════════════════════╝');
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runSmokeTests, SmokeTestResult };
