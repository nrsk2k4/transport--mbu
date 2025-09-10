import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRideSchema, insertNotificationSchema, type WebSocketMessage } from "@shared/schema";

const connectedClients = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (data) => {
      try {
        const message: WebSocketMessage & { userId?: string } = JSON.parse(data.toString());
        
        if (message.userId) {
          connectedClients.set(message.userId, ws);
        }
        
        // Handle different message types
        switch (message.type) {
          case 'driver_location':
            broadcastToAll('driver_location', message.data);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client from connected clients
      const entries = Array.from(connectedClients.entries());
      for (const [userId, client] of entries) {
        if (client === ws) {
          connectedClients.delete(userId);
          break;
        }
      }
    });
  });

  function broadcastToUser(userId: string, type: string, data: any) {
    const client = connectedClients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  }

  function broadcastToAll(type: string, data: any) {
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  }

  // Authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update user online status
      await storage.updateUser(user.id, { isOnline: true });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users/me/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/drivers/online", async (req, res) => {
    try {
      const drivers = await storage.getOnlineDrivers();
      res.json(drivers.map(d => ({ ...d, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch online drivers" });
    }
  });

  // Ride routes
  app.post("/api/rides", async (req, res) => {
    try {
      const validatedData = insertRideSchema.parse(req.body);
      const ride = await storage.createRide({
        ...validatedData,
        studentId: req.body.studentId,
      });
      
      // Notify all online drivers about new ride request
      const onlineDrivers = await storage.getOnlineDrivers();
      onlineDrivers.forEach(driver => {
        broadcastToUser(driver.id, 'ride_request', ride);
      });
      
      // Create notification for student
      await storage.createNotification({
        userId: req.body.studentId,
        type: 'ride_request',
        title: 'Ride Requested',
        message: 'Your ride request has been submitted. Searching for drivers...',
        data: { rideId: ride.id }
      });
      
      res.json(ride);
    } catch (error) {
      res.status(400).json({ error: "Invalid ride data" });
    }
  });

  app.get("/api/rides/available", async (req, res) => {
    try {
      const rides = await storage.getAvailableRides();
      res.json(rides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available rides" });
    }
  });

  app.get("/api/rides/user/:userId", async (req, res) => {
    try {
      const rides = await storage.getRidesByUser(req.params.userId);
      res.json(rides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user rides" });
    }
  });

  app.get("/api/rides/active/:userId", async (req, res) => {
    try {
      const ride = await storage.getUserActiveRide(req.params.userId);
      res.json(ride || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active ride" });
    }
  });

  app.patch("/api/rides/:id", async (req, res) => {
    try {
      const ride = await storage.updateRide(req.params.id, req.body);
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      
      // Broadcast ride updates
      if (ride.studentId) {
        broadcastToUser(ride.studentId, 'ride_updated', ride);
      }
      if (ride.driverId) {
        broadcastToUser(ride.driverId, 'ride_updated', ride);
      }
      
      res.json(ride);
    } catch (error) {
      res.status(500).json({ error: "Failed to update ride" });
    }
  });

  app.post("/api/rides/:id/accept", async (req, res) => {
    try {
      const { driverId } = req.body;
      const ride = await storage.getRide(req.params.id);
      
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      
      if (ride.status !== "waiting") {
        return res.status(400).json({ error: "Ride is no longer available" });
      }
      
      const updatedRide = await storage.updateRide(req.params.id, {
        driverId,
        status: "accepted",
        acceptedAt: new Date(),
      });
      
      // Get driver info
      const driver = await storage.getUser(driverId);
      
      // Notify student about driver assignment
      if (ride.studentId) {
        await storage.createNotification({
          userId: ride.studentId,
          type: 'ride_accepted',
          title: 'Driver Found!',
          message: `${driver?.name} will pick you up shortly`,
          data: { rideId: ride.id, driverId }
        });
        
        broadcastToUser(ride.studentId, 'ride_accepted', {
          ride: updatedRide,
          driver
        });
      }
      
      res.json(updatedRide);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept ride" });
    }
  });

  app.post("/api/rides/:id/complete", async (req, res) => {
    try {
      const ride = await storage.updateRide(req.params.id, {
        status: "completed",
        completedAt: new Date(),
        actualDuration: req.body.actualDuration,
      });
      
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      
      // Update analytics
      const today = new Date().toISOString().split('T')[0];
      const analytics = await storage.getTodayAnalytics();
      if (analytics && analytics.totalRides !== null && analytics.totalRevenue !== null) {
        await storage.updateAnalytics(today, {
          totalRides: analytics.totalRides + 1,
          totalRevenue: (parseFloat(analytics.totalRevenue) + parseFloat(ride.fare)).toString(),
        });
      }
      
      // Notify both parties
      if (ride.studentId) {
        broadcastToUser(ride.studentId, 'ride_completed', ride);
      }
      if (ride.driverId) {
        broadcastToUser(ride.driverId, 'ride_completed', ride);
      }
      
      res.json(ride);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete ride" });
    }
  });

  // Pool suggestions
  app.get("/api/rides/:id/pool-suggestions", async (req, res) => {
    try {
      const suggestions = await storage.getPoolSuggestions(req.params.id);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pool suggestions" });
    }
  });

  // Notifications
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/today", async (req, res) => {
    try {
      const analytics = await storage.getTodayAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/demand-prediction", async (req, res) => {
    try {
      const data = await storage.getDemandPrediction();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch demand prediction" });
    }
  });

  app.get("/api/analytics/revenue", async (req, res) => {
    try {
      const data = await storage.getRevenueData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  // Driver location updates
  app.post("/api/drivers/:id/location", async (req, res) => {
    try {
      await storage.updateDriverLocation(req.params.id, req.body.location);
      
      // Broadcast location update
      broadcastToAll('driver_location', {
        driverId: req.params.id,
        location: req.body.location
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  return httpServer;
}
