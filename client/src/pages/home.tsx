import { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/use-websocket";
import StudentInterface from "../components/student-interface";
import DriverInterface from "../components/driver-interface";
import AdminInterface from "../components/admin-interface";
import NotificationToast from "../components/notification-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<'student' | 'driver' | 'admin'>('student');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [language, setLanguage] = useState('en');
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
  
  const { isConnected, sendMessage } = useWebSocket();

  // Mock login - in production this would be a proper auth system
  useEffect(() => {
    const mockUsers = {
      student: { id: 'student-1', name: 'Priya Sharma', role: 'student' },
      driver: { id: 'driver-1', name: 'Suresh Kumar', role: 'driver' },
      admin: { id: 'admin-1', name: 'Transport Admin', role: 'admin' }
    };
    setCurrentUser(mockUsers[currentRole]);
  }, [currentRole]);

  // Get notifications count
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;

  const showNotification = (title: string, message: string) => {
    setNotification({ title, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    if (currentUser) {
      sendMessage({
        type: 'driver_location',
        userId: currentUser.id,
        data: { userId: currentUser.id }
      });
    }
  }, [currentUser, sendMessage]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans" data-testid="main-container">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm" data-testid="header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Car className="text-primary-foreground text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MBU Smart Transport</h1>
                <p className="text-xs text-muted-foreground">Professional Transport Solution</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <Select value={language} onValueChange={setLanguage} data-testid="language-selector">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Role Switcher */}
              <div className="flex bg-secondary rounded-lg p-1" data-testid="role-switcher">
                <Button
                  variant={currentRole === 'student' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentRole('student')}
                  data-testid="button-student-role"
                >
                  Student
                </Button>
                <Button
                  variant={currentRole === 'driver' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentRole('driver')}
                  data-testid="button-driver-role"
                >
                  Driver
                </Button>
                <Button
                  variant={currentRole === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentRole('admin')}
                  data-testid="button-admin-role"
                >
                  Admin
                </Button>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative"
                  data-testid="button-notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium" data-testid="notification-badge">
                      {unreadCount}
                    </div>
                  )}
                </Button>
              </div>
              
              {/* Connection Status */}
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} data-testid="connection-status" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {currentRole === 'student' && <StudentInterface user={currentUser} onNotification={showNotification} />}
        {currentRole === 'driver' && <DriverInterface user={currentUser} onNotification={showNotification} />}
        {currentRole === 'admin' && <AdminInterface user={currentUser} onNotification={showNotification} />}
      </main>

      {notification && (
        <NotificationToast
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
