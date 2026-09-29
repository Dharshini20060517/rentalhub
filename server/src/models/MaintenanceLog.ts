import mongoose, { Schema, Document, Model } from 'mongoose';

export enum MaintenanceType {
  ROUTINE = 'ROUTINE',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  CLEANING = 'CLEANING',
  PARTS_REPLACEMENT = 'PARTS_REPLACEMENT',
}

export interface IMaintenanceLog extends Document {
  equipment: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  type: MaintenanceType;
  description: string;
  cost?: number;
  performedAt: Date;
  performedBy?: string;
  nextDueAt?: Date;
  attachments?: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceLogSchema = new Schema<IMaintenanceLog>(
  {
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(MaintenanceType), required: true },
    description: { type: String, required: true },
    cost: { type: Number, min: 0 },
    performedAt: { type: Date, required: true },
    performedBy: String,
    nextDueAt: Date,
    attachments: [{ type: String }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

maintenanceLogSchema.index({ equipment: 1, performedAt: -1 });
maintenanceLogSchema.index({ nextDueAt: 1 });

export const MaintenanceLog: Model<IMaintenanceLog> = mongoose.model<IMaintenanceLog>('MaintenanceLog', maintenanceLogSchema);
