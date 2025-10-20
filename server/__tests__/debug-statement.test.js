const mongoose = require("mongoose");
require("dotenv").config();

const Statement = require("../models/Statement");

describe("Debug Statement Creation", () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("Should create statement with all required fields", async () => {
    const testExperimentId = new mongoose.Types.ObjectId();
    const testGroupId = new mongoose.Types.ObjectId();

    const statementData = {
      name: "Test Statement",
      slateText: [
        {
          type: "paragraph",
          children: [{ text: "This is a test statement." }],
        },
      ],
      groupId: testGroupId,
      experimentId: testExperimentId,
    };

    try {
      const statement = new Statement(statementData);
      await statement.save();
      expect(statement.name).toBe("Test Statement");
      await Statement.findByIdAndDelete(statement._id);
    } catch (error) {
      console.error("Error creating statement:", error.message);
      throw error;
    }
  });
});
