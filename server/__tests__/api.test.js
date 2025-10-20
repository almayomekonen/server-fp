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
const Comparison = require("../models/Comparison");
const Comment = require("../models/Comment");
const CopyMessage = require("../models/CopyMessage");
const TaskMessage = require("../models/TaskMessage");

// Import routes
const experimentRoutes = require("../routes/experiment");
const copyRoutes = require("../routes/copy");
const taskRoutes = require("../routes/task");
const comparisonRoutes = require("../routes/comparison");
const commentRoutes = require("../routes/comment");
const statementRoutes = require("../routes/statement");
const groupRoutes = require("../routes/group");

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/api/experiments", experimentRoutes);
app.use("/api/copies", copyRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comparisons", comparisonRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/groups", groupRoutes);

// Test data storage
let testData = {
  investigator: null,
  coder: null,
  experiment: null,
  group: null,
  statement: null,
  copy1: null,
  copy2: null,
  task: null,
  comparison: null,
  comment: null,
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
  // Clean up all test data
  const testIds = [
    testData.copy1?._id,
    testData.copy2?._id,
    testData.task?._id,
    testData.statement?._id,
    testData.group?._id,
    testData.experiment?._id,
  ].filter(Boolean);

  // Delete test documents
  if (testData.copy1)
    await Copy.findByIdAndDelete(testData.copy1._id).catch(() => {});
  if (testData.copy2)
    await Copy.findByIdAndDelete(testData.copy2._id).catch(() => {});
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
    username: { $in: ["test_investigator_123", "test_coder_123"] },
  }).catch(() => {});

  await mongoose.connection.close();
  console.log("✅ Disconnected from test database");
});

describe("📋 Full Application Test Suite", () => {
  describe("🔧 Setup - Create Test Data", () => {
    test("Should create test investigator user", async () => {
      testData.investigator = new User({
        username: "test_investigator_123",
        email: "test_investigator@test.com",
        role: "investigator",
      });
      await testData.investigator.setPassword("test123");
      await testData.investigator.save();

      expect(testData.investigator._id).toBeDefined();
      expect(testData.investigator.username).toBe("test_investigator_123");
    });

    test("Should create test coder user", async () => {
      testData.coder = new User({
        username: "test_coder_123",
        email: "test_coder@test.com",
        role: "coder",
      });
      await testData.coder.setPassword("test123");
      await testData.coder.save();

      expect(testData.coder._id).toBeDefined();
      expect(testData.coder.username).toBe("test_coder_123");
    });

    test("Should create test experiment", async () => {
      const response = await request(app).post("/api/experiments").send({
        name: "Test Experiment",
        description: "Test Description",
        investigatorId: testData.investigator._id,
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Test Experiment");
      testData.experiment = response.body;
    });

    test("Should create test group", async () => {
      const response = await request(app).post("/api/groups").send({
        name: "Test Group",
        experimentId: testData.experiment._id,
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Test Group");
      testData.group = response.body;
    });

    test("Should create test statement", async () => {
      const response = await request(app)
        .post("/api/statements")
        .send({
          name: "Test Statement",
          slateText: [
            {
              type: "paragraph",
              children: [
                { text: "This is a test statement for testing purposes." },
              ],
            },
          ],
          groupId: testData.group._id,
          experimentId: testData.experiment._id,
        });

      if (response.status !== 201) {
        console.error("Statement creation failed:", response.body);
      }
      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Test Statement");
      testData.statement = response.body;
    });

    test("Should create first test copy", async () => {
      const response = await request(app)
        .post("/api/copies")
        .send({
          statementId: testData.statement._id,
          experimentId: testData.experiment._id,
          investigatorId: testData.investigator._id,
          coderId: testData.coder._id,
          highlights: [{ start: 0, end: 10, colorName: "yellow" }],
          colorCounts: { yellow: 1 },
        });

      expect(response.status).toBe(201);
      expect(response.body.statementId).toBe(testData.statement._id.toString());
      testData.copy1 = response.body;
    });

    test("Should create second test copy", async () => {
      const response = await request(app)
        .post("/api/copies")
        .send({
          statementId: testData.statement._id,
          experimentId: testData.experiment._id,
          investigatorId: testData.investigator._id,
          coderId: testData.coder._id,
          highlights: [{ start: 5, end: 15, colorName: "green" }],
          colorCounts: { green: 1 },
        });

      expect(response.status).toBe(201);
      testData.copy2 = response.body;
    });

    test("Should create test task", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .send({
          experimentId: testData.experiment._id,
          copiesId: [testData.copy1._id],
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

  describe("📝 Copy Operations", () => {
    test("Should get all copies", async () => {
      const response = await request(app).get("/api/copies");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("Should update copy with new highlights", async () => {
      const response = await request(app)
        .put(`/api/copies/${testData.copy1._id}`)
        .send({
          highlights: [
            { start: 0, end: 10, colorName: "yellow" },
            { start: 20, end: 30, colorName: "green" },
          ],
          colorCounts: { yellow: 1, green: 1 },
        });

      expect(response.status).toBe(200);
      expect(response.body.copy.highlights.length).toBe(2);
    });

    test("Should add comment to copy", async () => {
      const response = await request(app)
        .post("/api/comments")
        .send({
          copyId: testData.copy1._id,
          userId: testData.investigator._id,
          text: "This is a test comment",
          position: { start: 5, end: 10 },
        });

      expect(response.status).toBe(201);
      expect(response.body.text).toBe("This is a test comment");
      testData.comment = response.body;
    });

    test("Should get comments for copy", async () => {
      const response = await request(app).get(
        `/api/comments/copy/${testData.copy1._id}`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe("🔄 Comparison Operations", () => {
    test("Should create comparison between two copies", async () => {
      const response = await request(app).post("/api/comparisons").send({
        copyId1: testData.copy1._id,
        copyId2: testData.copy2._id,
      });

      expect(response.status).toBe(201);
      testData.comparison = response.body;
    });

    test("Should get all comparisons", async () => {
      const response = await request(app).get("/api/comparisons");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("Should check if comparison exists", async () => {
      const response = await request(app).post("/api/comparisons/exists").send({
        copyId1: testData.copy1._id,
        copyId2: testData.copy2._id,
      });

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(true);
    });

    test("Should get comparisons for specific copy", async () => {
      const response = await request(app).get(
        `/api/comparisons/copy/${testData.copy1._id}`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("Should delete comparison", async () => {
      const response = await request(app).delete("/api/comparisons").send({
        copyId1: testData.copy1._id,
        copyId2: testData.copy2._id,
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("נמחקה בהצלחה");
    });

    test("Should verify comparison was deleted", async () => {
      const response = await request(app).post("/api/comparisons/exists").send({
        copyId1: testData.copy1._id,
        copyId2: testData.copy2._id,
      });

      expect(response.status).toBe(200);
      expect(response.body.exists).toBe(false);
    });
  });

  describe("📋 Task Operations", () => {
    test("Should get all tasks", async () => {
      const response = await request(app).get("/api/tasks");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("Should update task", async () => {
      const response = await request(app)
        .put(`/api/tasks/${testData.task._id}`)
        .send({
          status: "in_progress",
        });

      expect(response.status).toBe(200);
      expect(response.body.task.status).toBe("in_progress");
    });

    test("Should add copy to task", async () => {
      const response = await request(app)
        .put(`/api/tasks/${testData.task._id}`)
        .send({
          addCopy: testData.copy2._id,
        });

      expect(response.status).toBe(200);
      expect(response.body.task.copiesId).toContain(
        testData.copy2._id.toString()
      );
    });

    test("Should remove copy from task", async () => {
      const response = await request(app)
        .put(`/api/tasks/${testData.task._id}`)
        .send({
          removeCopy: testData.copy2._id,
        });

      expect(response.status).toBe(200);
      expect(response.body.task.copiesId).not.toContain(
        testData.copy2._id.toString()
      );
    });
  });

  describe("🗑️ CASCADE DELETE TESTS", () => {
    describe("Delete Copy with Cascade", () => {
      let testCopy, testComment;

      beforeAll(async () => {
        // Create a copy for deletion test
        const copyResponse = await request(app).post("/api/copies").send({
          statementId: testData.statement._id,
          experimentId: testData.experiment._id,
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

      test("Should delete copy and cascade delete related data", async () => {
        const response = await request(app).delete(
          `/api/copies/${testCopy._id}`
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toContain("נמחק בהצלחה");
      });

      test("Should verify copy was deleted", async () => {
        const copy = await Copy.findById(testCopy._id);
        expect(copy).toBeNull();
      });

      test("Should verify related comments were deleted", async () => {
        const comments = await Comment.find({ copyId: testCopy._id });
        expect(comments.length).toBe(0);
      });

      test("Should verify copy was removed from tasks", async () => {
        const tasks = await Task.find({ copiesId: testCopy._id });
        expect(tasks.length).toBe(0);
      });
    });

    describe("Delete Task with Cascade", () => {
      let testTask, testMessage;

      beforeAll(async () => {
        // Create a task for deletion test
        const taskResponse = await request(app)
          .post("/api/tasks")
          .send({
            experimentId: testData.experiment._id,
            copiesId: [testData.copy1._id],
            investigatorId: testData.investigator._id,
            coderId: testData.coder._id,
          });
        testTask = taskResponse.body;
      });

      test("Should delete task and cascade delete related data", async () => {
        const response = await request(app).delete(
          `/api/tasks/${testTask._id}`
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toContain("נמחקה בהצלחה");
      });

      test("Should verify task was deleted", async () => {
        const task = await Task.findById(testTask._id);
        expect(task).toBeNull();
      });
    });

    describe("Delete Experiment with Cascade", () => {
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
            text: "Statement to delete",
            slateText: [
              {
                type: "paragraph",
                children: [{ text: "Statement to delete" }],
              },
            ],
            groupId: testGroup._id,
          });
        testStatement = stmtResponse.body;

        const copyResponse = await request(app).post("/api/copies").send({
          statementId: testStatement._id,
          experimentId: testExperiment._id,
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

      test("Should delete experiment and cascade delete all related data", async () => {
        const response = await request(app).delete(
          `/api/experiments/${testExperiment._id}`
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toContain("נמחק בהצלחה");
      });

      test("Should verify experiment was deleted", async () => {
        const exp = await Experiment.findById(testExperiment._id);
        expect(exp).toBeNull();
      });

      test("Should verify groups were deleted", async () => {
        const groups = await Group.find({ experimentId: testExperiment._id });
        expect(groups.length).toBe(0);
      });

      test("Should verify statements were deleted", async () => {
        const stmt = await Statement.findById(testStatement._id);
        expect(stmt).toBeNull();
      });

      test("Should verify copies were deleted", async () => {
        const copy = await Copy.findById(testCopy._id);
        expect(copy).toBeNull();
      });

      test("Should verify tasks were deleted", async () => {
        const task = await Task.findById(testTask._id);
        expect(task).toBeNull();
      });
    });
  });

  describe("✏️ Edit Operations", () => {
    test("Should update copy highlights (simulate editing)", async () => {
      const newHighlights = [
        { start: 0, end: 5, colorName: "yellow" },
        { start: 10, end: 20, colorName: "green" },
        { start: 25, end: 35, colorName: "yellow" },
      ];

      const response = await request(app)
        .put(`/api/copies/${testData.copy1._id}`)
        .send({
          highlights: newHighlights,
          colorCounts: { yellow: 2, green: 1 },
        });

      expect(response.status).toBe(200);
      expect(response.body.copy.highlights.length).toBe(3);
      expect(response.body.copy.colorCounts.yellow).toBe(2);
      expect(response.body.copy.colorCounts.green).toBe(1);
    });

    test("Should update copy status", async () => {
      const response = await request(app)
        .put(`/api/copies/${testData.copy1._id}`)
        .send({
          status: "completed",
        });

      expect(response.status).toBe(200);
      expect(response.body.copy.status).toBe("completed");
    });

    test("Should delete and recreate comment (edit simulation)", async () => {
      // Delete old comment
      await request(app).delete(`/api/comments/${testData.comment._id}`);

      // Create new comment
      const response = await request(app)
        .post("/api/comments")
        .send({
          copyId: testData.copy1._id,
          userId: testData.investigator._id,
          text: "Updated comment text",
          position: { start: 5, end: 10 },
        });

      expect(response.status).toBe(201);
      expect(response.body.text).toBe("Updated comment text");
      testData.comment = response.body;
    });
  });

  describe("🔍 Data Integrity Tests", () => {
    test("Should not allow creating comparison with same copy twice", async () => {
      const response = await request(app).post("/api/comparisons").send({
        copyId1: testData.copy1._id,
        copyId2: testData.copy1._id,
      });

      expect(response.status).toBe(400);
    });

    test("Should handle non-existent copy gracefully", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/api/copies/${fakeId}`);

      expect(response.status).toBe(500);
    });

    test("Should verify all test copies still exist", async () => {
      const copy1 = await Copy.findById(testData.copy1._id);
      const copy2 = await Copy.findById(testData.copy2._id);

      expect(copy1).not.toBeNull();
      expect(copy2).not.toBeNull();
    });
  });
});

describe("📊 Performance Tests", () => {
  test("Should handle multiple copy operations quickly", async () => {
    const startTime = Date.now();

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(request(app).get("/api/copies"));
    }

    await Promise.all(promises);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});

console.log("✅ All tests defined and ready to run!");
