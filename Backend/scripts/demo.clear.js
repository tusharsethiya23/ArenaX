// demo.clear.js
// Removes all demo data (accounts with an @demo.arenax email and everything
// linked to them). Real users and their content are not touched.
// Usage: npm run clear:demo

const { connect, clearDemoData, mongoose } = require('./demo.common');

(async () => {
  try {
    await connect();
    const counts = await clearDemoData();
    if (!counts.users) {
      console.log('No demo data found. Nothing to remove.');
    } else {
      console.log('Removed demo data:');
      for (const [label, n] of Object.entries(counts)) if (n) console.log(`  ${label}: ${n}`);
    }
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
