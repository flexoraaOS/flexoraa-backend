
"use client";

import React, { useState, useMemo } from "react";
import { Search, MoreHorizontal, Info, Laptop } from "lucide-react";

// --- UI Components (assuming these are from your library, e.g., shadcn/ui) ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils"; // Your utility for merging class names

// --- Type Definition for Client Data ---
type Client = {
  client: string;
  industry: string;
  avatarHint: string;
  product: 'LeadOS' | 'AgentOS' | 'Both';
  leadOsCredits: number;
  leadOsMax: number;
  agentOsCredits: number;
  agentOsMax: number;
  status: 'Active' | 'Inactive';
};

// --- Dummy Data ---
const initialClientsData: Client[] = [
  { client: 'Innovate Corp', industry: 'Technology', avatarHint: 'Blue and white logo for a tech company', product: 'Both', leadOsCredits: 4500, leadOsMax: 5000, agentOsCredits: 8, agentOsMax: 10, status: 'Active' },
  { client: 'HealthWell', industry: 'Healthcare', avatarHint: 'Green cross logo for a healthcare provider', product: 'AgentOS', leadOsCredits: 0, leadOsMax: 0, agentOsCredits: 20, agentOsMax: 25, status: 'Active' },
  { client: 'QuantumLeap', industry: 'Finance', avatarHint: 'Gold and black logo for a financial firm', product: 'LeadOS', leadOsCredits: 12500, leadOsMax: 20000, agentOsCredits: 0, agentOsMax: 0, status: 'Active' },
  { client: 'TerraNova', industry: 'Real Estate', avatarHint: 'Logo with a house and a tree for a real estate agency', product: 'Both', leadOsCredits: 1800, leadOsMax: 10000, agentOsCredits: 3, agentOsMax: 5, status: 'Inactive' },
  { client: 'Momentum', industry: 'Logistics', avatarHint: 'Fast-moving arrow logo for a logistics company', product: 'AgentOS', leadOsCredits: 0, leadOsMax: 0, agentOsCredits: 45, agentOsMax: 50, status: 'Active' },
  { client: 'Artisan Goods', industry: 'Retail', avatarHint: 'Hand-crafted style logo for a retail business', product: 'LeadOS', leadOsCredits: 950, leadOsMax: 1000, agentOsCredits: 0, agentOsMax: 0, status: 'Inactive' },
];

// --- Main Reusable Component ---
export const ClientsTab = () => {
  const [clients, setClients] = useState<Client[]>(initialClientsData);
  const [searchTerm, setSearchTerm] = useState("");

  // Handler for toggling a client's active status
  const handleWorkspaceToggle = (clientName: string, checked: boolean) => {
    setClients(prevClients =>
      prevClients.map(client =>
        client.client === clientName
          ? { ...client, status: checked ? 'Active' : 'Inactive' }
          : client
      )
    );
    console.log(`Toggled status for ${clientName} to ${checked ? 'Active' : 'Inactive'}`);
  };

  // Placeholder for viewing client details
  const handleViewDetails = (client: Client) => {
    alert(`Viewing details for ${client.client}`);
    console.log(client);
  };

  // Memoized filtering logic for the search bar
  const filteredClients = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.client.toLowerCase().includes(lowercasedFilter) ||
      client.industry.toLowerCase().includes(lowercasedFilter)
    );
  }, [clients, searchTerm]);

  return (
    <TabsContent value="clients" className="space-y-8 pt-4">
      <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
        <CardHeader>
          <CardTitle>Client Management</CardTitle>
          <CardDescription>Oversee all client accounts and their configurations.</CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name or industry..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>LeadOS Usage</TableHead>
                <TableHead>AgentOS Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map(client => (
                <TableRow key={client.client}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${client.client.charAt(0)}`} data-ai-hint={client.avatarHint} />
                        <AvatarFallback>{client.client.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{client.client}</p>
                        <p className="text-xs text-muted-foreground">{client.industry}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.product}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.leadOsMax > 0 ? (
                      <div className="w-40">
                        <Progress value={(client.leadOsCredits / client.leadOsMax) * 100} />
                        <p className="text-xs text-right text-muted-foreground mt-1">{client.leadOsCredits.toLocaleString()}/{client.leadOsMax.toLocaleString()}</p>
                      </div>
                    ) : (<span className="text-muted-foreground">-</span>)}
                  </TableCell>
                  <TableCell>
                    {client.agentOsMax > 0 ? (
                      <div className="w-40">
                        <Progress value={(client.agentOsCredits / client.agentOsMax) * 100} />
                        <p className="text-xs text-right text-muted-foreground mt-1">{client.agentOsCredits.toLocaleString()}/{client.agentOsMax.toLocaleString()}</p>
                      </div>
                    ) : (<span className="text-muted-foreground">-</span>)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={client.status === 'Active'}
                        onCheckedChange={(checked) => handleWorkspaceToggle(client.client, checked)}
                        aria-label="Toggle client status"
                      />
                      <Badge variant={client.status === 'Active' ? 'default' : 'secondary'} className={cn(client.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/10')}>
                        {client.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                          <Info className="mr-2 h-4 w-4" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem><Laptop className="mr-2 h-4 w-4" />Login as Client</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
};