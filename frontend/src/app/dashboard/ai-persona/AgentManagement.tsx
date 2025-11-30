import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bot, PlusCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const initialAgents = [
  { id: "sales-assistant", name: "Sales Assistant", isActive: true },
  { id: "support-alpha", name: "Support Bot Alpha", isActive: false },
  { id: "general-inquiries", name: "General Inquiries Bot", isActive: false },
];

export default function AgentManagement() {
  const [agents, setAgents] = useState(initialAgents);

  const handleAgentToggle = (agentId: string, checked: boolean) => {
    setAgents((currentAgents) =>
      currentAgents.map((agent) =>
        agent.id === agentId
          ? { ...agent, isActive: checked }
          : { ...agent, isActive: false }
      )
    );
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
    //   toast.success(`${agent.name} is now ${checked ? "active" : "inactive"}`);
      toast.success(`${agent.name} is coming soon ...`);
    }
  };

  return (
    <Card className="p-6 w-full max-w-md">
      <CardHeader>
        <CardTitle>Agent Management</CardTitle>
        <CardDescription>Activate or deactivate agents.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-3 rounded-md bg-secondary/20"
          >
            <div className="flex items-center gap-2 p-2">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-medium">{agent.name}</span>
            </div>
            <Switch
              checked={agent.isActive}
              onCheckedChange={(checked) =>
                handleAgentToggle(agent.id, checked)
              }
            />
          </div>
        ))}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/create-agent" className="flex items-center justify-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Agent
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
