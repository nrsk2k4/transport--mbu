import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // student, driver, admin
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalRides: integer("total_rides").default(0),
  isOnline: boolean("is_online").default(false),
  location: jsonb("location"), // {lat, lng, address}
  vehicle: jsonb("vehicle"), // {make, model, plateNumber, color}
  earnings: decimal("earnings", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rides = pgTable("rides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id),
  driverId: varchar("driver_id").references(() => users.id),
  pickupLocation: jsonb("pickup_location").notNull(), // {lat, lng, address}
  dropLocation: jsonb("drop_location").notNull(), // {lat, lng, address}
  status: text("status").notNull().default("waiting"), // waiting, accepted, in_progress, completed, cancelled
  rideType: text("ride_type").notNull().default("solo"), // solo, pool
  fare: decimal("fare", { precision: 8, scale: 2 }).notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  distance: decimal("distance", { precision: 6, scale: 2 }), // in km
  poolRideId: varchar("pool_ride_id"), // for grouping pool rides
  poolPassengers: jsonb("pool_passengers"), // array of passenger info
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // ride_request, ride_accepted, ride_completed, driver_online, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // additional notification data
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const poolSuggestions = pgTable("pool_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rideId: varchar("ride_id").references(() => rides.id),
  suggestedRideId: varchar("suggested_ride_id").references(() => rides.id),
  savings: decimal("savings", { precision: 6, scale: 2 }),
  compatibilityScore: decimal("compatibility_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalRides: integer("total_rides").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  activeDrivers: integer("active_drivers").default(0),
  avgWaitTime: decimal("avg_wait_time", { precision: 5, scale: 2 }).default("0.00"), // in minutes
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default("0.00"),
  peakHours: jsonb("peak_hours"), // hourly demand data
  poolRidePercentage: decimal("pool_ride_percentage", { precision: 5, scale: 2 }).default("0.00"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  phone: true,
  email: true,
  vehicle: true,
});

export const insertRideSchema = createInsertSchema(rides).pick({
  pickupLocation: true,
  dropLocation: true,
  rideType: true,
  fare: true,
  estimatedDuration: true,
  distance: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  data: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRide = z.infer<typeof insertRideSchema>;
export type Ride = typeof rides.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type PoolSuggestion = typeof poolSuggestions.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;

// WebSocket message types
export type WebSocketMessage = {
  type: 'ride_request' | 'ride_accepted' | 'ride_completed' | 'driver_location' | 'notification';
  data: any;
  userId?: string;
  rideId?: string;
};
