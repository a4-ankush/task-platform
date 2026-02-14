const express = require('express');
const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { requireAuth } = require('../middleware/auth');
const { Task, STATUSES, PRIORITIES } = require('../models/Task');
const { emitTaskEvent } = require('../realtime/socket');

const router = express.Router();
router.use(requireAuth);

function getVisibilityFilter(user) {
  if (user.role === 'admin' || user.role === 'manager') {
    return { deletedAt: null };
  }
  return {
    deletedAt: null,
    $or: [{ assignee: user.id }, { createdBy: user.id }],
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: z.enum(STATUSES).optional(),
        assignee: z.string().optional(),
        createdBy: z.string().optional(),
        priority: z.enum(PRIORITIES).optional(),
        q: z.string().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status']).default('updatedAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
      .parse(req.query);

    const filter = getVisibilityFilter(req.user);
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    if (query.assignee) filter.assignee = query.assignee;
    if (query.createdBy) filter.createdBy = query.createdBy;

    if (query.q) {
      filter.$text = { $search: query.q };
    }

    const sort = { [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1 };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(query.limit).populate('assignee', 'email name role').lean(),
      Task.countDocuments(filter),
    ]);

    res.json({
      items: items.map((t) => ({
        id: String(t._id),
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignee: t.assignee
          ? { id: String(t.assignee._id), email: t.assignee.email, name: t.assignee.name, role: t.assignee.role }
          : null,
        createdBy: String(t.createdBy),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      page: query.page,
      limit: query.limit,
      total,
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        dueDate: z.coerce.date().optional(),
        assignee: z.string().nullable().optional(),
      })
      .parse(req.body);

    const assignee = body.assignee ?? null;

    if (req.user.role === 'user') {
      if (assignee && assignee !== req.user.id) {
        throw new ApiError(403, 'Users can only assign tasks to themselves');
      }
    }

    const task = await Task.create({
      title: body.title,
      description: body.description ?? '',
      status: body.status ?? 'todo',
      priority: body.priority ?? 'medium',
      dueDate: body.dueDate ?? null,
      assignee,
      createdBy: req.user.id,
    });

    const io = req.app.get('io');
    if (io) {
      const full = await Task.findById(task._id)
        .populate('assignee', 'email name role')
        .lean();
      emitTaskEvent(io, 'created', full);
    }

    res.status(201).json({ id: String(task._id) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        dueDate: z.coerce.date().nullable().optional(),
        assignee: z.string().nullable().optional(),
      })
      .parse(req.body);

    const visibility = getVisibilityFilter(req.user);
    const task = await Task.findOne({ _id: params.id, ...visibility });
    if (!task) throw new ApiError(404, 'Task not found');

    if (req.user.role === 'user') {
      if (body.assignee && body.assignee !== req.user.id) {
        throw new ApiError(403, 'Users can only assign tasks to themselves');
      }
    }

    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    if (body.status !== undefined) task.status = body.status;
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.dueDate !== undefined) task.dueDate = body.dueDate;
    if (body.assignee !== undefined) task.assignee = body.assignee;

    await task.save();

    const io = req.app.get('io');
    if (io) {
      const full = await Task.findById(task._id)
        .populate('assignee', 'email name role')
        .lean();
      emitTaskEvent(io, 'updated', full);
    }

    res.json({ ok: true });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);

    const visibility = getVisibilityFilter(req.user);
    const task = await Task.findOne({ _id: params.id, ...visibility });
    if (!task) throw new ApiError(404, 'Task not found');

    task.deletedAt = new Date();
    await task.save();

    const io = req.app.get('io');
    if (io) {
      emitTaskEvent(io, 'deleted', {
        _id: task._id,
        deletedAt: task.deletedAt,
        assignee: task.assignee,
      });
    }

    res.json({ ok: true });
  })
);

module.exports = { router };
