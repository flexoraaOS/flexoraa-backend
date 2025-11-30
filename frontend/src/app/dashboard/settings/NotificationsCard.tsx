import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function NotificationsCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive updates about your account and new features.</p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="lead-alerts" className="font-medium">Lead Alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified immediately when a new HOT lead is identified.</p>
                    </div>
                    <Switch id="lead-alerts" defaultChecked/>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="weekly-reports" className="font-medium">Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">Receive a summary of campaign performance every Monday.</p>
                    </div>
                    <Switch id="weekly-reports" />
                </div>
            </CardContent>
        </Card>
    );
}