const express = require("express");
const { z } = require("zod");

const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { User, ROLES } = require("../models/User");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        q: z.string().optional(),
        role: z.enum(ROLES).optional(),
        sortBy: z
          .enum(["createdAt", "email", "name", "role"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
      .parse(req.query);

    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.q) {
      filter.$or = [
        { email: { $regex: query.q, $options: "i" } },
        { name: { $regex: query.q, $options: "i" } },
      ];
    }

    const sort = { [query.sortBy]: query.sortOrder === "asc" ? 1 : -1 };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      items: items.map((u) => ({
        id: String(u._id),
        email: u.email,
        name: u.name,
        role: u.role,
      })),
      page: query.page,
      limit: query.limit,
      total,
    });
  }),
);

router.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.enum(ROLES),
        password: z.string().min(8),
      })
      .parse(req.body);

    const existing = await User.findOne({ email: body.email });
    if (existing) throw new ApiError(409, "Email already registered");

    const passwordHash = await User.hashPassword(body.password);
    const user = await User.create({
      email: body.email,
      name: body.name,
      role: body.role,
      passwordHash,
    });

    res.status(201).json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

router.patch(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = z
      .object({
        name: z.string().min(1).optional(),
        role: z.enum(ROLES).optional(),
      })
      .parse(req.body);

    const user = await User.findById(params.id);
    if (!user) throw new ApiError(404, "User not found");

    if (body.name !== undefined) user.name = body.name;
    if (body.role !== undefined) user.role = body.role;
    await user.save();

    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

module.exports = { router };
