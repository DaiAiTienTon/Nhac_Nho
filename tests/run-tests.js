import { runDateUtilsTests } from './date-utils.test.js';
import { runValidationTests } from './validation.test.js';
import { runStorageTests } from './storage-manager.test.js';
import { runReminderManagerTests } from './reminder-manager.test.js';

async function main() {
  console.log('==============================================');
  console.log('  Running Event Reminder Unit Test Suites');
  console.log('==============================================\n');

  try {
    runDateUtilsTests();
    console.log('\n');

    runValidationTests();
    console.log('\n');

    await runStorageTests();
    console.log('\n');

    await runReminderManagerTests();
    console.log('\n');

    console.log('==============================================');
    console.log('  🎉 ALL TEST SUITES PASSED SUCCESSFULLY!');
    console.log('==============================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

main();
