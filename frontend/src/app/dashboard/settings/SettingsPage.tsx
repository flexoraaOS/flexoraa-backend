import PersonalInfoCard from './PersonalInfoCard';
import SecurityCard from './SecurityCard';
import TeamManagementCard from './TeamManagementCard';
import NotificationsCard from './NotificationsCard';
import AppearanceCard from './AppearanceCard';
import DangerZoneCard from './DangerZoneCard';
import CompanyDetailsCard from './CompanyDetailsCard';

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your account settings and preferences.
                </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <PersonalInfoCard />
                    <SecurityCard />
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <TeamManagementCard />
                    <NotificationsCard />
                </div>
                <div className="lg:col-span-3 space-y-8">
                    <CompanyDetailsCard />
                </div>
                <div className="lg:col-span-3 grid md:grid-cols-2 gap-8">
                    <AppearanceCard />
                    <DangerZoneCard />
                </div>
            </div>
        </div>
    );
}