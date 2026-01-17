const mongoose = require("mongoose");
const User = require("../models/User");
const Experiment = require("../models/Experiment");
const Group = require("../models/Group");
const Statement = require("../models/Statement");
const Copy = require("../models/Copy");
const Task = require("../models/Task");
const CopyMessage = require("../models/CopyMessage");
const TaskMessage = require("../models/TaskMessage");
const Comment = require("../models/Comment");
const Comparison = require("../models/Comparison");

// Helper to apply session if it exists
const withSession = (query, session) =>
  session ? query.session(session) : query;

async function deleteCopyCascade(copyId, session) {
  await withSession(CopyMessage.deleteMany({ copyId }), session);
  await withSession(Comment.deleteMany({ copyId }), session);
  await withSession(
    Comparison.deleteMany({ $or: [{ copyA: copyId }, { copyB: copyId }] }),
    session
  );
  await withSession(
    Task.updateMany({ copiesId: copyId }, { $pull: { copiesId: copyId } }),
    session
  );
  await withSession(Copy.findByIdAndDelete(copyId), session);
}

async function deleteTaskCascade(taskId, session) {
  await withSession(TaskMessage.deleteMany({ taskId }), session);
  await withSession(Task.findByIdAndDelete(taskId), session);
}

async function deleteStatementCascade(statementId, session) {
  const copies = await withSession(Copy.find({ statementId }), session);
  for (const copy of copies) {
    await deleteCopyCascade(copy._id, session);
  }
  await withSession(Statement.findByIdAndDelete(statementId), session);
}

async function deleteGroupCascade(groupId, session) {
  const statements = await withSession(Statement.find({ groupId }), session);
  for (const statement of statements) {
    await deleteStatementCascade(statement._id, session);
  }
  await withSession(Group.findByIdAndDelete(groupId), session);
}

async function deleteExperimentCascade(experimentId, session) {
  const tasks = await withSession(Task.find({ experimentId }), session);
  for (const task of tasks) {
    await deleteTaskCascade(task._id, session);
  }

  const groups = await withSession(Group.find({ experimentId }), session);
  for (const group of groups) {
    await deleteGroupCascade(group._id, session);
  }

  await withSession(Experiment.findByIdAndDelete(experimentId), session);
}


async function deleteUserCascade(userId, session) {
  // Collect all IDs before deletion for real-time events
  const copies = await withSession(
    Copy.find({ $or: [{ investigatorId: userId }, { coderId: userId }] }),
    session
  );
  const copyIds = copies.map(c => c._id.toString());

  const experiments = await withSession(
    Experiment.find({ investigatorId: userId }),
    session
  );
  const experimentIds = experiments.map(e => e._id.toString());

  const tasks = await withSession(
    Task.find({ $or: [{ investigatorId: userId }, { coderId: userId }] }),
    session
  );
  const taskIds = tasks.map(t => t._id.toString());

  // Perform cascading deletions
  for (const copy of copies) {
    await deleteCopyCascade(copy._id, session);
  }

  for (const exp of experiments) {
    await deleteExperimentCascade(exp._id, session);
  }

  for (const task of tasks) {
    await deleteTaskCascade(task._id, session);
  }

  // Messages written in copies
  await withSession(CopyMessage.deleteMany({ senderId: userId }), session);

  // Messages written in tasks
  await withSession(TaskMessage.deleteMany({ senderId: userId }), session);

  // Comments
  await withSession(Comment.deleteMany({ userId }), session);

  // Finally, delete the user
  await withSession(User.findByIdAndDelete(userId), session);

  // 🔴 Emit real-time events for all cascaded deletions
  if (global.io) {
    console.log(`🔴 [USER DELETE CASCADE] Emitting events for user ${userId}`);
    
    // Emit copy deletions
    copyIds.forEach(copyId => {
      global.io.emit("copyDeleted", { copyId });
      console.log(`  ✅ Emitted copyDeleted: ${copyId}`);
    });

    // Emit experiment deletions
    experimentIds.forEach(experimentId => {
      global.io.emit("experimentDeleted", { experimentId });
      console.log(`  ✅ Emitted experimentDeleted: ${experimentId}`);
    });

    // Emit task deletions
    taskIds.forEach(taskId => {
      global.io.emit("taskDeleted", { taskId });
      console.log(`  ✅ Emitted taskDeleted: ${taskId}`);
    });

    console.log(`🔴 [USER DELETE CASCADE] Completed: ${copyIds.length} copies, ${experimentIds.length} experiments, ${taskIds.length} tasks`);
  }
}

module.exports = {
  deleteCopyCascade,
  deleteTaskCascade,
  deleteStatementCascade,
  deleteGroupCascade,
  deleteExperimentCascade,
  deleteUserCascade,
};
