const lucide = require('lucide-react');

const iconsToCheck = [
  'Send',
  'Users',
  'ShieldAlert',
  'CheckCircle2',
  'UserCheck',
  'AlertTriangle',
  'X',
  'Loader2'
];

console.log("Checking Lucide Icons:");
iconsToCheck.forEach(iconName => {
  console.log(`${iconName}:`, !!lucide[iconName]);
});
