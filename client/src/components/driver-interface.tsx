import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LiveMap from "./live-map";
import { apiRequest } from "../lib/queryClient";
import { User, Car, Clock, Star, Phone, MapPin, IndianRupee, Users, Navigation } from "lucide-react";

interface DriverInterfaceProps {
  user: any;
  onNotification: (title: string, message: string) => void;
}

export default function DriverInterface({ user, onNotification }: DriverInterfaceProps) {
  const [isOnline, setIsOnline] = useState(false);
  const queryClient = useQueryClient();

  // Get available rides
  const { data: availableRides = [] } = useQuery({
    queryKey: ['/api/rides/available'],
    refetchInterval: 3000,
  });

  // Get driver's active ride
  const { data: activeRide = null } = useQuery({
    queryKey: ['/api/rides/active', user?.id],
    enabled: !!user?.id,
    refetchInterval: 2000,
  });

  // Get driver's ride history
  const { data: rideHistory = [] } = useQuery({
    queryKey: ['/api/rides/user', user?.id],
    enabled: !!user?.id,
  });

  // Accept ride mutation
  const acceptRideMutation = useMutation({
    mutationFn: async (rideId: string) => {
      const response = await apiRequest('POST', `/api/rides/${rideId}/accept`, {
        driverId: user.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rides/active'] });
      onNotification('Ride Accepted', 'You have accepted a ride request!');
    },
    onError: () => {
      onNotification('Error', 'Failed to accept ride. It may have been taken by another driver.');
    }
  });

  // Complete ride mutation
  const completeRideMutation = useMutation({
    mutationFn: async (rideId: string) => {
      const response = await apiRequest('POST', `/api/rides/${rideId}/complete`, {
        actualDuration: Math.floor(Math.random() * 30) + 10
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rides/active'] });
      onNotification('Trip Completed', 'Great job! Your earnings have been updated.');
    }
  });

  // Update driver availability
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (online: boolean) => {
      const response = await apiRequest('PATCH', `/api/users/${user.id}`, {
        isOnline: online
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    }
  });

  const handleToggleAvailability = (checked: boolean) => {
    setIsOnline(checked);
    updateAvailabilityMutation.mutate(checked);
    
    if (checked) {
      onNotification('You\'re Online', 'You will now receive ride requests');
    } else {
      onNotification('You\'re Offline', 'You won\'t receive new ride requests');
    }
  };

  const todaysEarnings = Array.isArray(rideHistory) ? rideHistory.filter((ride: any) => {
    const today = new Date().toDateString();
    return new Date(ride.completedAt || ride.createdAt).toDateString() === today && ride.status === 'completed';
  }).reduce((sum: number, ride: any) => sum + parseFloat(ride.fare), 0) : 0;

  const todaysRides = Array.isArray(rideHistory) ? rideHistory.filter((ride: any) => {
    const today = new Date().toDateString();
    return new Date(ride.completedAt || ride.createdAt).toDateString() === today && ride.status === 'completed';
  }).length : 0;

  return (
    <div className="space-y-6" data-testid="driver-interface">
      {/* Driver Status Card */}
      <Card data-testid="driver-status-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{user?.name || 'Suresh Kumar'}</h2>
                <p className="text-muted-foreground">Maruti Swift • KA 01 AB 1234</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex text-yellow-500 text-sm">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">4.8 (234 rides)</span>
                </div>
              </div>
            </div>
            
            {/* Availability Toggle */}
            <div className="text-right">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm text-muted-foreground">Available</span>
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleToggleAvailability}
                  data-testid="switch-availability"
                />
              </div>
              <Badge variant={isOnline ? 'default' : 'secondary'} data-testid="status-badge">
                <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-todays-earnings">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₹{todaysEarnings.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Today's Earnings</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-rides-completed">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{todaysRides}</p>
              <p className="text-sm text-muted-foreground">Rides Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-online-time">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">6.5h</p>
              <p className="text-sm text-muted-foreground">Online Time</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-rating">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">4.8</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Rides */}
        <Card data-testid="available-rides">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="text-primary mr-2 h-5 w-5" />
              Available Rides
              <Badge variant="secondary" className="ml-2">{Array.isArray(availableRides) ? availableRides.length : 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Array.isArray(availableRides) && availableRides.map((ride: any) => (
                <Card key={ride.id} className="border border-border hover:border-primary transition-all cursor-pointer" data-testid={`ride-card-${ride.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">Student</span>
                          {ride.rideType === 'pool' && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Pool
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>{ride.pickupLocation.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span>{ride.dropLocation.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{ride.fare}</p>
                        <p className="text-xs text-muted-foreground">{ride.distance} km • {ride.estimatedDuration} min</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {Math.floor((new Date().getTime() - new Date(ride.createdAt).getTime()) / 60000)} min ago
                        </span>
                      </div>
                      <Button 
                        onClick={() => acceptRideMutation.mutate(ride.id)}
                        disabled={acceptRideMutation.isPending || !isOnline}
                        size="sm"
                        data-testid={`button-accept-ride-${ride.id}`}
                      >
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!Array.isArray(availableRides) || availableRides.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No available rides</p>
                  <p className="text-sm">New ride requests will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Map and Current Trip */}
        <div className="space-y-4">
          {/* Navigation */}
          <Card data-testid="navigation-card">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Navigation className="text-primary mr-2 h-4 w-4" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <LiveMap />
              </div>
            </CardContent>
          </Card>
          
          {/* Current Trip */}
          <Card data-testid="current-trip">
            <CardHeader>
              <CardTitle className="text-base">Current Trip</CardTitle>
            </CardHeader>
            <CardContent>
              {activeRide ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg text-white bg-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Trip in Progress</p>
                        <p className="text-sm opacity-90">
                          {activeRide?.pickupLocation?.address} → {activeRide?.dropLocation?.address}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-white/20 border-white/20 text-white hover:bg-white/30"
                        data-testid="button-call-passenger"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Trip Fare:</span>
                      <span className="font-medium text-green-600">₹{activeRide?.fare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{activeRide?.distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="outline">{activeRide?.status}</Badge>
                    </div>
                  </div>
                  
                  {activeRide?.status === 'accepted' && (
                    <Button 
                      onClick={() => activeRide?.id && completeRideMutation.mutate(activeRide.id)}
                      disabled={completeRideMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                      data-testid="button-complete-trip"
                    >
                      Complete Trip
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active trip</p>
                  <p className="text-sm">Accept a ride to start earning</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
