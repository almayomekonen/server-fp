// Clean Orphaned Data from Production Database
require("dotenv").config();
const mongoose = require("mongoose");

const Copy = require("./models/Copy");
const Statement = require("./models/Statement");
const Experiment = require("./models/Experiment");

async function cleanProductionDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🔍 Checking for orphaned copies...\n");

    // Get all copies
    const allCopies = await Copy.find({}).lean();
    console.log(`📊 Total copies in database: ${allCopies.length}\n`);

    let orphanedCount = 0;
    const orphanedCopyIds = [];

    // Check each copy
    for (const copy of allCopies) {
      let isOrphaned = false;
      let reason = "";

      // Check if statement exists
      const statement = await Statement.findById(copy.statementId);
      if (!statement) {
        isOrphaned = true;
        reason = `Statement ${copy.statementId} not found`;
      }

      // Check if experiment exists
      const experiment = await Experiment.findById(copy.experimentId);
      if (!experiment) {
        isOrphaned = true;
        reason = reason
          ? `${reason}, Experiment ${copy.experimentId} not found`
          : `Experiment ${copy.experimentId} not found`;
      }

      if (isOrphaned) {
        orphanedCount++;
        orphanedCopyIds.push(copy._id);
        console.log(`❌ Orphaned copy found:`);
        console.log(`   Copy ID: ${copy._id}`);
        console.log(`   Coder ID: ${copy.coderId}`);
        console.log(`   Statement ID: ${copy.statementId}`);
        console.log(`   Experiment ID: ${copy.experimentId}`);
        console.log(`   Reason: ${reason}\n`);
      }
    }

    if (orphanedCount === 0) {
      console.log("✅ No orphaned copies found! Database is clean.\n");
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`\n⚠️  Found ${orphanedCount} orphaned copies`);
    console.log("🗑️  Deleting orphaned copies...\n");

    // Delete orphaned copies using deleteMany for efficiency
    const result = await Copy.deleteMany({ _id: { $in: orphanedCopyIds } });
    console.log(`✅ Deleted ${result.deletedCount} orphaned copies`);

    console.log(
      `\n🎉 Cleanup complete! Deleted ${result.deletedCount} orphaned copies.\n`
    );

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    console.error("Stack:", err.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run cleanup
cleanProductionDatabase();
