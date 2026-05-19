import { sendEmail } from './services/email';

// Parse command line arguments
const args = process.argv.slice(2);

let to: string | null = null;
let useHtml = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--to' || arg === '-t') {
    if (i + 1 < args.length) {
      to = args[++i];
    } else {
      console.error('Error: --to/-t requires an argument');
      process.exit(1);
    }
  } else if (arg === '--html' || arg === '-html') {
    useHtml = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Usage: tsx src/cli.ts --to <email> [--html]

Options:
  --to, -t <email>   Recipient email address (required)
  --html, -html      Send email as HTML (default: plain text)
  --help, -h         Show this help message
    `);
    process.exit(0);
  } else {
    console.error(`Error: Unknown argument '${arg}'`);
    process.exit(1);
  }
}

if (!to) {
  console.error('Error: Recipient email address is required (--to or -t)');
  process.exit(1);
}

// Send test email
(async () => {
  try {
    if (useHtml) {
      await sendEmail({
        to,
        subject: 'Test Email from KYC Platform (HTML)',
        html: '<h1>Test Email</h1><p>This is a test email sent in HTML format.</p>',
      });
      console.log(`Test HTML email sent to ${to}`);
    } else {
      await sendEmail({
        to,
        subject: 'Test Email from KYC Platform (Plain Text)',
        text: 'This is a test email sent in plain text format.',
      });
      console.log(`Test plain text email sent to ${to}`);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    process.exit(1);
  }
})();