import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LiveMap from "./live-map";
import { apiRequest } from "../lib/queryClient";
import { MapPin, Clock, Car, Users, Star, Phone, IndianRupee } from "lucide-react";

interface StudentInterfaceProps {
  user: any;
  onNotification: (title: string, message: string) => void;
}

export default function StudentInterface({ user, onNotification }: StudentInterfaceProps) {
  const [pickupLocation, setPickupLocation] = useState("MBU Main Gate");
  const [dropLocation, setDropLocation] = useState("");
  const [rideType, setRideType] = useState<'solo' | 'pool'>('solo');
  const queryClient = useQueryClient();

  // Get user's active ride
  const { data: activeRide = null } = useQuery({
    queryKey: ['/api/rides/active', user?.id],
    enabled: !!user?.id,
    refetchInterval: 2000,
  });

  // Get user's ride history
  const { data: rideHistory = [] } = useQuery({
    queryKey: ['/api/rides/user', user?.id],
    enabled: !!user?.id,
  });

  // Get today's analytics for stats
  const { data: analytics = {} } = useQuery({
    queryKey: ['/api/analytics/today'],
  });

  // Request ride mutation
  const requestRideMutation = useMutation({
    mutationFn: async (rideData: any) => {
      const response = await apiRequest('POST', '/api/rides', rideData);
      return response.json();
    },
    onSuccess: (ride) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/active'] });
      onNotification('Ride Requested', 'Searching for nearby drivers...');
    },
    onError: () => {
      onNotification('Error', 'Failed to request ride. Please try again.');
    }
  });

  // Cancel ride mutation
  const cancelRideMutation = useMutation({
    mutationFn: async (rideId: string) => {
      const response = await apiRequest('PATCH', `/api/rides/${rideId}`, {
        status: 'cancelled'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/active'] });
      onNotification('Ride Cancelled', 'Your ride has been cancelled.');
    }
  });

  const handleRequestRide = () => {
    if (!pickupLocation || !dropLocation) {
      onNotification('Error', 'Please enter both pickup and drop locations.');
      return;
    }

    const estimatedDistance = Math.random() * 10 + 2; // Mock distance calculation
    const baseFare = rideType === 'solo' ? 45 : 32;
    const fare = baseFare + (estimatedDistance * 8);

    requestRideMutation.mutate({
      studentId: user.id,
      pickupLocation: { lat: 12.9716, lng: 77.5946, address: pickupLocation },
      dropLocation: { lat: 12.9716 + Math.random() * 0.1, lng: 77.5946 + Math.random() * 0.1, address: dropLocation },
      rideType,
      fare: fare.toFixed(2),
      estimatedDuration: Math.floor(estimatedDistance * 3),
      distance: estimatedDistance.toFixed(2)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'in_progress': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Searching for Driver...';
      case 'accepted': return 'Driver Assigned';
      case 'in_progress': return 'Trip in Progress';
      case 'completed': return 'Trip Completed';
      case 'cancelled': return 'Trip Cancelled';
      default: return status;
    }
  };

  return (
    <div className="space-y-6" data-testid="student-interface">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-avg-wait-time">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="text-blue-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                <p className="text-lg font-semibold">{analytics?.avgWaitTime || '4.2'} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-available-drivers">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Car className="text-green-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Drivers</p>
                <p className="text-lg font-semibold">{analytics?.activeDrivers || '12'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-base-fare">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="text-orange-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Base Fare</p>
                <p className="text-lg font-semibold">₹25</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-pool-savings">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pool Savings</p>
                <p className="text-lg font-semibold text-green-600">30%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ride Request Form */}
        <div className="lg:col-span-2">
          <Card data-testid="ride-request-form">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="text-primary mr-2 h-5 w-5" />
                Request a Ride
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pickup">Pickup Location</Label>
                <div className="relative">
                  <Input
                    id="pickup"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Enter pickup location"
                    className="pl-10"
                    data-testid="input-pickup-location"
                  />
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="drop">Drop Location</Label>
                <div className="relative">
                  <Input
                    id="drop"
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                    placeholder="Enter destination"
                    className="pl-10"
                    data-testid="input-drop-location"
                  />
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                </div>
              </div>
              
              {/* Ride Type Selection */}
              <div>
                <Label>Ride Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Card 
                    className={`cursor-pointer transition-all ${rideType === 'solo' ? 'border-primary bg-primary/10' : 'hover:border-primary'}`}
                    onClick={() => setRideType('solo')}
                    data-testid="ride-type-solo"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Solo Ride</h4>
                          <p className="text-sm text-muted-foreground">Private ride</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">₹45</p>
                          <p className="text-xs text-muted-foreground">Est. fare</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-all ${rideType === 'pool' ? 'border-primary bg-primary/10' : 'hover:border-primary'}`}
                    onClick={() => setRideType('pool')}
                    data-testid="ride-type-pool"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Pool Ride</h4>
                          <p className="text-sm text-muted-foreground">Share & save</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">₹32</p>
                          <p className="text-xs text-muted-foreground">Est. fare</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Pool Suggestions */}
              {rideType === 'pool' && (
                <Card className="bg-muted" data-testid="pool-suggestions">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm mb-2 flex items-center">
                      <Users className="text-primary mr-2 h-4 w-4" />
                      Pool Suggestions
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-card rounded-md text-sm">
                        <span>Priya S. - Library → City Center</span>
                        <span className="text-green-600 font-medium">Save ₹8</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-card rounded-md text-sm">
                        <span>Rahul K. - Hostel → Railway Station</span>
                        <span className="text-green-600 font-medium">Save ₹12</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Button 
                onClick={handleRequestRide}
                disabled={requestRideMutation.isPending || !!activeRide}
                className="w-full"
                data-testid="button-request-ride"
              >
                <Car className="mr-2 h-4 w-4" />
                {requestRideMutation.isPending ? 'Requesting...' : 'Request Ride'}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Map and Current Ride */}
        <div className="space-y-4">
          {/* Live Map */}
          <Card data-testid="live-map-card">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <MapPin className="text-primary mr-2 h-4 w-4" />
                Live Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <LiveMap />
              </div>
            </CardContent>
          </Card>
          
          {/* Current Ride Status */}
          <Card data-testid="current-ride-status">
            <CardHeader>
              <CardTitle className="text-base">Current Ride</CardTitle>
            </CardHeader>
            <CardContent>
              {activeRide ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg text-white ${getStatusColor(activeRide?.status || 'waiting')}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getStatusText(activeRide?.status || 'waiting')}</p>
                        <p className="text-sm opacity-90">
                          {activeRide?.status === 'waiting' && 'Est. 3-5 minutes'}
                          {activeRide?.status === 'accepted' && 'Driver is on the way'}
                          {activeRide?.status === 'in_progress' && 'Enjoy your ride!'}
                        </p>
                      </div>
                      {activeRide?.status === 'waiting' && (
                        <div className="animate-spin">
                          <Car className="h-5 w-5" />
                        </div>
                      )}
                      {activeRide?.status === 'accepted' && (
                        <Button size="sm" variant="outline" className="bg-white/20 border-white/20 text-white hover:bg-white/30">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ride ID:</span>
                      <span className="font-medium">#{activeRide?.id?.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fare:</span>
                      <span className="font-medium text-green-600">₹{activeRide?.fare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{activeRide?.distance} km</span>
                    </div>
                  </div>
                  
                  {activeRide?.status === 'waiting' && (
                    <Button 
                      onClick={() => activeRide?.id && cancelRideMutation.mutate(activeRide.id)}
                      disabled={cancelRideMutation.isPending}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      data-testid="button-cancel-ride"
                    >
                      Cancel Ride
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active ride</p>
                  <p className="text-sm">Request a ride to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Rides */}
      <Card data-testid="recent-rides">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Clock className="text-primary mr-2 h-5 w-5" />
              Recent Rides
            </span>
            <Button variant="link" size="sm">View All</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.isArray(rideHistory) && rideHistory.slice(0, 3).map((ride: any) => (
              <div key={ride.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ride.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {ride.status === 'completed' ? (
                      <Star className="text-green-600 h-5 w-5" />
                    ) : (
                      <Car className="text-gray-600 h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{ride.pickupLocation.address} → {ride.dropLocation.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(ride.createdAt).toLocaleDateString()} • 
                      {ride.status === 'completed' && ride.rating && (
                        <span className="ml-2">
                          {'★'.repeat(ride.rating)} ({ride.rating}/5)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{ride.fare}</p>
                  <Badge variant={ride.status === 'completed' ? 'default' : 'secondary'}>
                    {ride.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!Array.isArray(rideHistory) || rideHistory.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No ride history</p>
                <p className="text-sm">Your completed rides will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
