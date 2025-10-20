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

/**
 * Delete User with all their creations (copies, experiments, tasks, messages, comments)
 */
async function deleteUserCascade(userId, session) {
  // Copies created as coder
  const copies = await withSession(
    Copy.find({ $or: [{ investigatorId: userId }, { coderId: userId }] }),
    session
  );
  for (const copy of copies) {
    await deleteCopyCascade(copy._id, session);
  }

  // Experiments created as investigator
  const experiments = await withSession(
    Experiment.find({ investigatorId: userId }),
    session
  );
  for (const exp of experiments) {
    await deleteExperimentCascade(exp._id, session);
  }

  // Tasks assigned or created
  const tasks = await withSession(
    Task.find({ $or: [{ investigatorId: userId }, { coderId: userId }] }),
    session
  );
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
}

module.exports = {
  deleteCopyCascade,
  deleteTaskCascade,
  deleteStatementCascade,
  deleteGroupCascade,
  deleteExperimentCascade,
  deleteUserCascade,
};
