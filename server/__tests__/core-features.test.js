const request = require("supertest");
const mongoose = require("mongoose");
const express = require("express");
require("dotenv").config();

// Import models
const User = require("../models/User");
const Experiment = require("../models/Experiment");
const Group = require("../models/Group");
const Statement = require("../models/Statement");
const Copy = require("../models/Copy");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Comparison = require("../models/Comparison");

// Import routes
const experimentRoutes = require("../routes/experiment");
const copyRoutes = require("../routes/copy");
const taskRoutes = require("../routes/task");
const statementRoutes = require("../routes/statement");
const groupRoutes = require("../routes/group");
const commentRoutes = require("../routes/comment");

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/api/experiments", experimentRoutes);
app.use("/api/copies", copyRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/comments", commentRoutes);

// Test data storage
let testData = {
  investigator: null,
  coder: null,
  experiment: null,
  group: null,
  statement: null,
  copy: null,
  task: null,
};

// Connect to test database before all tests
beforeAll(async () => {
  const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MongoDB URI not found in environment variables");
  }
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to test database");
});

// Clean up test data after all tests
afterAll(async () => {
  // Clean up all test documents
  if (testData.copy)
    await Copy.findByIdAndDelete(testData.copy._id).catch(() => {});
  if (testData.task)
    await Task.findByIdAndDelete(testData.task._id).catch(() => {});
  if (testData.statement)
    await Statement.findByIdAndDelete(testData.statement._id).catch(() => {});
  if (testData.group)
    await Group.findByIdAndDelete(testData.group._id).catch(() => {});
  if (testData.experiment)
    await Experiment.findByIdAndDelete(testData.experiment._id).catch(() => {});

  // Delete test users
  await User.deleteMany({
    username: { $in: ["test_investigator_core", "test_coder_core"] },
  }).catch(() => {});

  await mongoose.connection.close();
  console.log("✅ Disconnected from test database");
});

describe("🎯 CORE FEATURES TEST - Critical Functionality Only", () => {
  describe("🔧 Setup - Create Test Data", () => {
    test("Should create test investigator user", async () => {
      testData.investigator = new User({
        username: "test_investigator_core",
        email: "test_investigator_core@test.com",
        role: "investigator",
      });
      await testData.investigator.setPassword("test123");
      await testData.investigator.save();

      expect(testData.investigator._id).toBeDefined();
      expect(testData.investigator.username).toBe("test_investigator_core");
    });

    test("Should create test coder user", async () => {
      testData.coder = new User({
        username: "test_coder_core",
        email: "test_coder_core@test.com",
        role: "coder",
      });
      await testData.coder.setPassword("test123");
      await testData.coder.save();

      expect(testData.coder._id).toBeDefined();
      expect(testData.coder.username).toBe("test_coder_core");
    });

    test("Should create test experiment", async () => {
      const response = await request(app).post("/api/experiments").send({
        name: "Core Test Experiment",
        description: "Testing core features",
        investigatorId: testData.investigator._id,
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Core Test Experiment");
      testData.experiment = response.body;
    });

    test("Should create test group", async () => {
      const response = await request(app).post("/api/groups").send({
        name: "Core Test Group",
        experimentId: testData.experiment._id,
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Core Test Group");
      testData.group = response.body;
    });

    test("Should create test statement", async () => {
      const response = await request(app)
        .post("/api/statements")
        .send({
          name: "Core Test Statement",
          slateText: [
            {
              type: "paragraph",
              children: [
                { text: "This is a test statement for core features." },
              ],
            },
          ],
          groupId: testData.group._id,
          experimentId: testData.experiment._id,
        });

      if (response.status !== 201) {
        console.error(
          "❌ Statement creation failed:",
          JSON.stringify(response.body, null, 2)
        );
      }

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Core Test Statement");
      testData.statement = response.body;
    });

    test("Should create test copy", async () => {
      const response = await request(app)
        .post("/api/copies")
        .send({
          statementId: testData.statement._id,
          experimentId: testData.experiment._id,
          groupId: testData.group._id,
          investigatorId: testData.investigator._id,
          coderId: testData.coder._id,
          highlights: [{ start: 0, end: 10, colorName: "yellow" }],
          colorCounts: { yellow: 1 },
        });

      expect(response.status).toBe(201);
      expect(response.body.statementId).toBe(testData.statement._id.toString());
      testData.copy = response.body;
    });

    test("Should create test task", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .send({
          experimentId: testData.experiment._id,
          copiesId: [testData.copy._id],
          investigatorId: testData.investigator._id,
          coderId: testData.coder._id,
        });

      expect(response.status).toBe(201);
      expect(response.body.experimentId).toBe(
        testData.experiment._id.toString()
      );
      testData.task = response.body;
    });
  });

  describe("🗑️ CORE FEATURE 1: Delete Copy with CASCADE", () => {
    let testCopy, testComment;

    beforeAll(async () => {
      // Create a copy for deletion test
      const copyResponse = await request(app).post("/api/copies").send({
        statementId: testData.statement._id,
        experimentId: testData.experiment._id,
        groupId: testData.group._id,
        investigatorId: testData.investigator._id,
        coderId: testData.coder._id,
        highlights: [],
        colorCounts: {},
      });
      testCopy = copyResponse.body;

      // Add a comment to this copy
      const commentResponse = await request(app)
        .post("/api/comments")
        .send({
          copyId: testCopy._id,
          userId: testData.investigator._id,
          text: "Comment to be deleted",
          position: { start: 0, end: 5 },
        });
      testComment = commentResponse.body;
    });

    test("✅ Should delete copy and cascade delete related data", async () => {
      const response = await request(app).delete(`/api/copies/${testCopy._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("נמחק בהצלחה");
    });

    test("✅ Should verify copy was deleted", async () => {
      const copy = await Copy.findById(testCopy._id);
      expect(copy).toBeNull();
    });

    test("✅ Should verify related comments were deleted", async () => {
      const comments = await Comment.find({ copyId: testCopy._id });
      expect(comments.length).toBe(0);
    });

    test("✅ Should verify copy was removed from tasks", async () => {
      const tasks = await Task.find({ copiesId: testCopy._id });
      expect(tasks.length).toBe(0);
    });
  });

  describe("🗑️ CORE FEATURE 2: Delete Task with CASCADE", () => {
    let testTask;

    beforeAll(async () => {
      // Create a task for deletion test
      const taskResponse = await request(app)
        .post("/api/tasks")
        .send({
          experimentId: testData.experiment._id,
          copiesId: [testData.copy._id],
          investigatorId: testData.investigator._id,
          coderId: testData.coder._id,
        });
      testTask = taskResponse.body;
    });

    test("✅ Should delete task and cascade delete related data", async () => {
      const response = await request(app).delete(`/api/tasks/${testTask._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("נמחקה בהצלחה");
    });

    test("✅ Should verify task was deleted", async () => {
      const task = await Task.findById(testTask._id);
      expect(task).toBeNull();
    });
  });

  describe("🗑️ CORE FEATURE 3: Delete Experiment with CASCADE", () => {
    let testExperiment, testGroup, testStatement, testCopy, testTask;

    beforeAll(async () => {
      // Create experiment hierarchy for deletion test
      const expResponse = await request(app).post("/api/experiments").send({
        name: "Experiment to Delete",
        description: "Will be deleted with cascade",
        investigatorId: testData.investigator._id,
      });
      testExperiment = expResponse.body;

      const groupResponse = await request(app).post("/api/groups").send({
        name: "Group to Delete",
        experimentId: testExperiment._id,
      });
      testGroup = groupResponse.body;

      const stmtResponse = await request(app)
        .post("/api/statements")
        .send({
          name: "Statement to delete",
          slateText: [
            {
              type: "paragraph",
              children: [{ text: "Statement to delete" }],
            },
          ],
          groupId: testGroup._id,
          experimentId: testExperiment._id,
        });
      testStatement = stmtResponse.body;

      const copyResponse = await request(app).post("/api/copies").send({
        statementId: testStatement._id,
        experimentId: testExperiment._id,
        groupId: testGroup._id,
        investigatorId: testData.investigator._id,
        coderId: testData.coder._id,
        highlights: [],
        colorCounts: {},
      });
      testCopy = copyResponse.body;

      const taskResponse = await request(app)
        .post("/api/tasks")
        .send({
          experimentId: testExperiment._id,
          copiesId: [testCopy._id],
          investigatorId: testData.investigator._id,
          coderId: testData.coder._id,
        });
      testTask = taskResponse.body;
    });

    test("✅ Should delete experiment and cascade delete all related data", async () => {
      const response = await request(app).delete(
        `/api/experiments/${testExperiment._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("נמחק בהצלחה");
    });

    test("✅ Should verify experiment was deleted", async () => {
      const exp = await Experiment.findById(testExperiment._id);
      expect(exp).toBeNull();
    });

    test("✅ Should verify groups were deleted", async () => {
      const groups = await Group.find({ experimentId: testExperiment._id });
      expect(groups.length).toBe(0);
    });

    test("✅ Should verify statements were deleted", async () => {
      const stmt = await Statement.findById(testStatement._id);
      expect(stmt).toBeNull();
    });

    test("✅ Should verify copies were deleted", async () => {
      const copy = await Copy.findById(testCopy._id);
      expect(copy).toBeNull();
    });

    test("✅ Should verify tasks were deleted", async () => {
      const task = await Task.findById(testTask._id);
      expect(task).toBeNull();
    });
  });
});

console.log("✅ Core features test ready!");
