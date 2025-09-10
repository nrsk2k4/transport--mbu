import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Car, Users, IndianRupee, Star, Activity, TrendingUp, BarChart3, User } from "lucide-react";

interface AdminInterfaceProps {
  user: any;
  onNotification: (title: string, message: string) => void;
}

export default function AdminInterface({ user, onNotification }: AdminInterfaceProps) {
  const demandChartRef = useRef<HTMLCanvasElement>(null);
  const revenueChartRef = useRef<HTMLCanvasElement>(null);

  // Get analytics data
  const { data: analytics = {} } = useQuery({
    queryKey: ['/api/analytics/today'],
  });

  // Get demand prediction data
  const { data: demandData = {} } = useQuery({
    queryKey: ['/api/analytics/demand-prediction'],
  });

  // Get revenue data
  const { data: revenueData = {} } = useQuery({
    queryKey: ['/api/analytics/revenue'],
  });

  // Get online drivers
  const { data: onlineDrivers = [] } = useQuery({
    queryKey: ['/api/drivers/online'],
  });

  // Initialize charts when data is available
  useEffect(() => {
    if (demandData && demandChartRef.current) {
      initializeDemandChart();
    }
  }, [demandData]);

  useEffect(() => {
    if (revenueData && revenueChartRef.current) {
      initializeRevenueChart();
    }
  }, [revenueData]);

  const initializeDemandChart = () => {
    const canvas = demandChartRef.current;
    if (!canvas || !demandData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple canvas-based chart implementation
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw predicted data
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    (demandData?.predicted || []).forEach((value: number, index: number) => {
      const x = padding + (index * chartWidth) / ((demandData?.predicted?.length || 1) - 1);
      const y = canvas.height - padding - (value * chartHeight) / Math.max(...(demandData?.predicted || [1]));
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw actual data
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    (demandData?.actual || []).forEach((value: number, index: number) => {
      const x = padding + (index * chartWidth) / ((demandData?.actual?.length || 1) - 1);
      const y = canvas.height - padding - (value * chartHeight) / Math.max(...(demandData?.predicted || [1]));
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  const initializeRevenueChart = () => {
    const canvas = revenueChartRef.current;
    if (!canvas || !revenueData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / (revenueData?.data?.length || 1);
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw bars
    ctx.fillStyle = '#f59e0b';
    (revenueData?.data || []).forEach((value: number, index: number) => {
      const x = padding + index * barWidth + barWidth * 0.2;
      const barHeight = (value * chartHeight) / Math.max(...(revenueData?.data || [1]));
      const y = canvas.height - padding - barHeight;
      ctx.fillRect(x, y, barWidth * 0.6, barHeight);
    });
  };

  const mockActivity = [
    { type: 'completed', message: 'Ride completed: Priya S. → City Mall', detail: 'Driver: Suresh Kumar • ₹42', time: '2m ago' },
    { type: 'request', message: 'New ride request: Hostel → Library', detail: 'Student: Rahul K. • Pool ride', time: '3m ago' },
    { type: 'online', message: 'Driver came online: Ramesh Babu', detail: 'Location: MBU Main Gate', time: '5m ago' },
    { type: 'rating', message: '5-star rating received', detail: 'Driver: Krishna Reddy', time: '7m ago' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completed': return <Car className="h-4 w-4 text-green-600" />;
      case 'request': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'online': return <User className="h-4 w-4 text-orange-600" />;
      case 'rating': return <Star className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-interface">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="stat-total-rides">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Rides Today</p>
                <p className="text-3xl font-bold text-primary">{analytics?.totalRides || 142}</p>
                <p className="text-green-600 text-sm mt-1">↑ 12% from yesterday</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="text-blue-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-active-drivers">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Drivers</p>
                <p className="text-3xl font-bold text-green-600">{analytics?.activeDrivers || 23}</p>
                <p className="text-green-600 text-sm mt-1">↑ 5 since morning</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-revenue-today">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Revenue Today</p>
                <p className="text-3xl font-bold text-orange-600">₹{analytics?.totalRevenue || '6,240'}</p>
                <p className="text-green-600 text-sm mt-1">↑ 8% from yesterday</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="text-orange-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-avg-rating">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Rating</p>
                <p className="text-3xl font-bold text-yellow-600">{analytics?.avgRating || '4.7'}</p>
                <p className="text-green-600 text-sm mt-1">Excellent service</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="text-yellow-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand Prediction Chart */}
        <Card data-testid="demand-prediction-chart">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="text-primary mr-2 h-5 w-5" />
              AI Demand Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              <canvas
                ref={demandChartRef}
                width={400}
                height={250}
                className="w-full h-full"
              />
              <div className="absolute top-2 right-2 flex space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-0.5 bg-blue-500 mr-1"></div>
                  <span>Predicted</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-0.5 bg-orange-500 mr-1"></div>
                  <span>Actual</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Revenue Chart */}
        <Card data-testid="revenue-trends-chart">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="text-primary mr-2 h-5 w-5" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <canvas
                ref={revenueChartRef}
                width={400}
                height={250}
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity and Driver Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity */}
        <div className="lg:col-span-2">
          <Card data-testid="realtime-activity">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Activity className="text-primary mr-2 h-5 w-5" />
                  Real-time Activity
                </span>
                <span className="text-sm text-muted-foreground">Last updated: just now</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {mockActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg" data-testid={`activity-item-${index}`}>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Driver Management */}
        <Card data-testid="driver-management">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="text-primary mr-2 h-5 w-5" />
              Driver Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(onlineDrivers) && onlineDrivers.slice(0, 4).map((driver: any) => (
                <div key={driver.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`driver-status-${driver.id}`}>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">{driver.vehicle?.plateNumber || 'Vehicle Info'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-2 h-2 bg-green-500 rounded-full mb-1" />
                    <p className="text-xs text-muted-foreground">
                      {driver.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="secondary" 
                className="w-full mt-4"
                data-testid="button-manage-drivers"
              >
                Manage All Drivers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
