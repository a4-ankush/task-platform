const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "manager", "user"];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLES, default: "user", index: true },
    passwordHash: { type: String, required: true },

    // Refresh rotation
    refreshTokenId: { type: String, default: null },

    // Password reset
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.methods.verifyPassword = async function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const User = mongoose.model("User", userSchema);

module.exports = { User, ROLES };
