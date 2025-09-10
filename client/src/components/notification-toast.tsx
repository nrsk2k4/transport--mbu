import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

interface NotificationToastProps {
  title: string;
  message: string;
  onClose: () => void;
}

export default function NotificationToast({ title, message, onClose }: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300" data-testid="notification-toast">
      <Card className="bg-card border border-border shadow-lg max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="text-blue-600 h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm" data-testid="notification-title">{title}</p>
              <p className="text-xs text-muted-foreground" data-testid="notification-message">{message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted"
              data-testid="button-close-notification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
