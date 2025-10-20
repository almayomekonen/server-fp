// Quick cleanup script - Run this NOW!
// Usage: MONGO_URI="your-url" node CLEAN_NOW.js

const mongoose = require("mongoose");

// Simple schemas
const Copy = mongoose.model("Copy", new mongoose.Schema({}, { strict: false }));
const Statement = mongoose.model(
  "Statement",
  new mongoose.Schema({}, { strict: false })
);
const Experiment = mongoose.model(
  "Experiment",
  new mongoose.Schema({}, { strict: false })
);

async function cleanNow() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ Error: MONGO_URI environment variable not set!");
      console.log("\nUsage:");
      console.log('MONGO_URI="mongodb://..." node CLEAN_NOW.js');
      process.exit(1);
    }

    console.log("🔌 Connecting to production MongoDB...\n");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected!\n");

    const allCopies = await Copy.find({}).lean();
    console.log(`📊 Found ${allCopies.length} copies in database\n`);

    const orphanedIds = [];

    for (const copy of allCopies) {
      const statement = await Statement.findById(copy.statementId);
      const experiment = await Experiment.findById(copy.experimentId);

      if (!statement || !experiment) {
        orphanedIds.push(copy._id);
        console.log(`❌ Orphaned: ${copy._id}`);
        console.log(`   Statement exists: ${!!statement}`);
        console.log(`   Experiment exists: ${!!experiment}\n`);
      }
    }

    if (orphanedIds.length === 0) {
      console.log("✅ No orphaned copies found!\n");
    } else {
      console.log(`\n🗑️  Deleting ${orphanedIds.length} orphaned copies...\n`);
      const result = await Copy.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`✅ Deleted ${result.deletedCount} copies!\n`);
      console.log("🎉 Production database is now clean!\n");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

cleanNow();
