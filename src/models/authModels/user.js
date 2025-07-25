import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 20,
      select: false,
    },
    role: {
      type: String,
      default: "user",
      required: true,
    },
    profileImage: {
      type: String,
    },
    buildingName: { type: String, required: true },
    areaName: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.isPasswordMatch = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default model("User", userSchema);
