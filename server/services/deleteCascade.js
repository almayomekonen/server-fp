const mongoose = require('mongoose');
const User = require('../models/User');
const Experiment = require('../models/Experiment');
const Group = require('../models/Group');
const Statement = require('../models/Statement');
const Copy = require('../models/Copy');
const Task = require('../models/Task');
const CopyMessage = require('../models/CopyMessage');
const TaskMessage = require('../models/TaskMessage');
const Comment = require('../models/Comment');
const Comparison = require('../models/Comparison');

/**
 * Delete Copy with all its dependencies (cascade)
 */
async function deleteCopyCascade(copyId, session) {
  await CopyMessage.deleteMany({ copyId }).session(session);
  await Comment.deleteMany({ copyId }).session(session);
  await Comparison.deleteMany({ $or: [{ copyA: copyId }, { copyB: copyId }] }).session(session);
  await Task.updateMany({ copiesId: copyId }, { $pull: { copiesId: copyId } }).session(session);
  await Copy.findByIdAndDelete(copyId).session(session);
}

/**
 * Delete Task with all its messages
 */
async function deleteTaskCascade(taskId, session) {
  await TaskMessage.deleteMany({ taskId }).session(session);
  await Task.findByIdAndDelete(taskId).session(session);
}

/**
 * Delete Statement with all copies
 */
async function deleteStatementCascade(statementId, session) {
  const copies = await Copy.find({ statementId }).session(session);
  for (const copy of copies) {
    await deleteCopyCascade(copy._id, session);
  }
  await Statement.findByIdAndDelete(statementId).session(session);
}

/**
 * Delete Group with all statements (and their copies)
 */
async function deleteGroupCascade(groupId, session) {
  const statements = await Statement.find({ groupId }).session(session);
  for (const statement of statements) {
    await deleteStatementCascade(statement._id, session);
  }
  await Group.findByIdAndDelete(groupId).session(session);
}

/**
 * Delete Experiment with all tasks, groups, statements, and copies
 */
async function deleteExperimentCascade(experimentId, session) {
  const tasks = await Task.find({ experimentId }).session(session);
  for (const task of tasks) {
    await deleteTaskCascade(task._id, session);
  }

  const groups = await Group.find({ experimentId }).session(session);
  for (const group of groups) {
    await deleteGroupCascade(group._id, session);
  }

  await Experiment.findByIdAndDelete(experimentId).session(session);
}

/**
 * Delete User with all their creations (copies, experiments, tasks, messages, comments)
 */
async function deleteUserCascade(userId, session) {
  // Copies created as coder
  const copies = await Copy.find({ $or: [{ investigatorId: userId }, { coderId: userId }] }).session(session);
  for (const copy of copies) {
    await deleteCopyCascade(copy._id, session);
  }

  // Experiments created as investigator
  const experiments = await Experiment.find({ investigatorId: userId }).session(session);
  for (const exp of experiments) {
    await deleteExperimentCascade(exp._id, session);
  }

  // Tasks assigned or created
  const tasks = await Task.find({ $or: [{ investigatorId: userId }, { coderId: userId }] }).session(session);
  for (const task of tasks) {
    await deleteTaskCascade(task._id, session);
  }

  // Messages written in copies
  await CopyMessage.deleteMany({ senderId: userId }).session(session);

  // Messages written in tasks
  await TaskMessage.deleteMany({ senderId: userId }).session(session);

  // Comments
  await Comment.deleteMany({ userId }).session(session);

  // Finally, delete the user
  await User.findByIdAndDelete(userId).session(session);
}

module.exports = {
  deleteCopyCascade,
  deleteTaskCascade,
  deleteStatementCascade,
  deleteGroupCascade,
  deleteExperimentCascade,
  deleteUserCascade,
};
