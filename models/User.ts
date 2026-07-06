import { Schema, model, models, type Document, type Model } from "mongoose";

interface ModuleProgressDoc {
  viewed: boolean;
  attempted: boolean;
  completed: boolean;
}

export interface UserProgress {
  modules: Map<string, ModuleProgressDoc>;
  streak: {
    count: number;
    lastVisitDate: string | null;
  };
  activeTrack: string;
}

export interface UserDoc extends Document {
  email: string;
  passwordHash: string;
  createdAt: Date;
  progress: UserProgress;
}

const ModuleProgressSchema = new Schema<ModuleProgressDoc>(
  {
    viewed: { type: Boolean, default: false },
    attempted: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema<UserDoc>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  progress: {
    modules: { type: Map, of: ModuleProgressSchema, default: {} },
    streak: {
      count: { type: Number, default: 0 },
      lastVisitDate: { type: String, default: null },
    },
    activeTrack: { type: String, default: "node" },
  },
});

export default (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);
