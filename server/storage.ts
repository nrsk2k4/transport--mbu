import { type User, type InsertUser, type Ride, type InsertRide, type Notification, type InsertNotification, type PoolSuggestion, type Analytics } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getOnlineDrivers(): Promise<User[]>;
  updateDriverLocation(driverId: string, location: any): Promise<void>;
  
  // Ride methods
  createRide(ride: InsertRide & { studentId: string }): Promise<Ride>;
  getRide(id: string): Promise<Ride | undefined>;
  updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined>;
  getRidesByUser(userId: string): Promise<Ride[]>;
  getAvailableRides(): Promise<Ride[]>;
  getUserActiveRide(userId: string): Promise<Ride | undefined>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // Pool suggestion methods
  createPoolSuggestion(rideId: string, suggestedRideId: string, savings: number): Promise<PoolSuggestion>;
  getPoolSuggestions(rideId: string): Promise<PoolSuggestion[]>;
  
  // Analytics methods
  getTodayAnalytics(): Promise<Analytics | undefined>;
  updateAnalytics(date: string, updates: Partial<Analytics>): Promise<void>;
  getDemandPrediction(): Promise<any>;
  getRevenueData(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rides: Map<string, Ride>;
  private notifications: Map<string, Notification>;
  private poolSuggestions: Map<string, PoolSuggestion>;
  private analytics: Map<string, Analytics>;

  constructor() {
    this.users = new Map();
    this.rides = new Map();
    this.notifications = new Map();
    this.poolSuggestions = new Map();
    this.analytics = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users
    const sampleUsers = [
      {
        id: "student-1",
        username: "priya.sharma",
        password: "password123",
        role: "student",
        name: "Priya Sharma",
        phone: "+91 9876543210",
        email: "priya@mbu.edu",
        rating: "4.6",
        totalRides: 45,
        isOnline: true,
        location: { lat: 12.9716, lng: 77.5946, address: "MBU Main Gate" },
        vehicle: null,
        earnings: "0.00",
        createdAt: new Date(),
      },
      {
        id: "driver-1",
        username: "suresh.kumar",
        password: "password123",
        role: "driver",
        name: "Suresh Kumar",
        phone: "+91 9876543211",
        email: "suresh@mbu.transport",
        rating: "4.8",
        totalRides: 234,
        isOnline: true,
        location: { lat: 12.9720, lng: 77.5950, address: "Near MBU Main Gate" },
        vehicle: { make: "Maruti", model: "Swift", plateNumber: "KA 01 AB 1234", color: "White" },
        earnings: "12450.00",
        createdAt: new Date(),
      },
      {
        id: "admin-1",
        username: "admin",
        password: "password123",
        role: "admin",
        name: "Transport Admin",
        phone: "+91 9876543212",
        email: "admin@mbu.transport",
        rating: "0.00",
        totalRides: 0,
        isOnline: true,
        location: null,
        vehicle: null,
        earnings: "0.00",
        createdAt: new Date(),
      }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user as User));

    // Initialize today's analytics
    const today = new Date().toISOString().split('T')[0];
    this.analytics.set(today, {
      id: randomUUID(),
      date: today,
      totalRides: 142,
      totalRevenue: "6240.00",
      activeDrivers: 23,
      avgWaitTime: "4.20",
      avgRating: "4.70",
      peakHours: {
        "06": 12, "07": 25, "08": 45, "09": 38, "10": 25, "11": 22,
        "12": 35, "13": 28, "14": 32, "15": 45, "16": 67, "17": 89,
        "18": 78, "19": 65, "20": 45, "21": 34, "22": 23, "23": 12
      },
      poolRidePercentage: "30.00",
    } as Analytics);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "student",
      phone: insertUser.phone || null,
      email: insertUser.email || null,
      vehicle: insertUser.vehicle || null,
      rating: "0.00",
      totalRides: 0,
      isOnline: false,
      location: null,
      earnings: "0.00",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getOnlineDrivers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === "driver" && user.isOnline
    );
  }

  async updateDriverLocation(driverId: string, location: any): Promise<void> {
    const driver = this.users.get(driverId);
    if (driver) {
      driver.location = location;
      this.users.set(driverId, driver);
    }
  }

  async createRide(rideData: InsertRide & { studentId: string }): Promise<Ride> {
    const id = randomUUID();
    const ride: Ride = {
      ...rideData,
      id,
      rideType: rideData.rideType || "solo",
      estimatedDuration: rideData.estimatedDuration || null,
      distance: rideData.distance || null,
      driverId: null,
      status: "waiting",
      poolRideId: null,
      poolPassengers: null,
      paymentStatus: "pending",
      rating: null,
      feedback: null,
      createdAt: new Date(),
      acceptedAt: null,
      startedAt: null,
      completedAt: null,
      actualDuration: null,
    };
    this.rides.set(id, ride);
    return ride;
  }

  async getRide(id: string): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async updateRide(id: string, updates: Partial<Ride>): Promise<Ride | undefined> {
    const ride = this.rides.get(id);
    if (!ride) return undefined;
    
    const updatedRide = { ...ride, ...updates };
    this.rides.set(id, updatedRide);
    return updatedRide;
  }

  async getRidesByUser(userId: string): Promise<Ride[]> {
    return Array.from(this.rides.values()).filter(ride => 
      ride.studentId === userId || ride.driverId === userId
    ).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getAvailableRides(): Promise<Ride[]> {
    return Array.from(this.rides.values()).filter(ride => 
      ride.status === "waiting"
    ).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getUserActiveRide(userId: string): Promise<Ride | undefined> {
    return Array.from(this.rides.values()).find(ride => 
      (ride.studentId === userId || ride.driverId === userId) && 
      ["waiting", "accepted", "in_progress"].includes(ride.status)
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      data: notification.data || null,
      userId: notification.userId || null,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(id, notification);
    }
  }

  async createPoolSuggestion(rideId: string, suggestedRideId: string, savings: number): Promise<PoolSuggestion> {
    const id = randomUUID();
    const suggestion: PoolSuggestion = {
      id,
      rideId,
      suggestedRideId,
      savings: savings.toString(),
      compatibilityScore: "0.85",
      createdAt: new Date(),
    };
    this.poolSuggestions.set(id, suggestion);
    return suggestion;
  }

  async getPoolSuggestions(rideId: string): Promise<PoolSuggestion[]> {
    return Array.from(this.poolSuggestions.values()).filter(suggestion => 
      suggestion.rideId === rideId
    );
  }

  async getTodayAnalytics(): Promise<Analytics | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return this.analytics.get(today);
  }

  async updateAnalytics(date: string, updates: Partial<Analytics>): Promise<void> {
    const existing = this.analytics.get(date);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.analytics.set(date, updated);
    } else {
      const newAnalytics: Analytics = {
        id: randomUUID(),
        date,
        totalRides: 0,
        totalRevenue: "0.00",
        activeDrivers: 0,
        avgWaitTime: "0.00",
        avgRating: "0.00",
        peakHours: {},
        poolRidePercentage: "0.00",
        ...updates,
      };
      this.analytics.set(date, newAnalytics);
    }
  }

  async getDemandPrediction(): Promise<any> {
    return {
      labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'],
      predicted: [12, 45, 25, 35, 67, 89, 23],
      actual: [8, 42, 28, 32, 71, 85, 19]
    };
  }

  async getRevenueData(): Promise<any> {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [5200, 6100, 4800, 5900, 6240, 7100, 5800]
    };
  }
}

export const storage = new MemStorage();
