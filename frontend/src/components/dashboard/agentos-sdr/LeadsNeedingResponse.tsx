"use client";

import React, { JSX, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, MessageSquare, Instagram, Facebook , Hand} from 'lucide-react';
// Dummy types
type Conversation = {
  id: string;
  customer: string;
  avatar: string;
  channel: string;
  lastMessage: string;
  status: string;
};

 const channelIcons: { [key: string]: JSX.Element } = {
    WhatsApp: <MessageSquare className="h-5 w-5 text-green-500" />,
    Instagram: <Instagram className="h-5 w-5 text-pink-500" />,
    Facebook: <Facebook className="h-5 w-5 text-blue-600" />,
    Gmail: <Mail className="h-5 w-5 text-red-500" />,
  };

// Dummy data
const dummyConversations: Conversation[] = [
  {
    id: "1",
    customer: "John Doe",
    avatar: "JD",
    channel: "Instagram",
    lastMessage: "Please call me back.",
    status: "Needs Attention",
  },
  {
    id: "2",
    customer: "Jane Smith",
    avatar: "JS",
    channel: "WhatsApp",
    lastMessage: "I need help with my order.",
    status: "Needs Attention",
  },
];

interface LeadsNeedingResponseDialogProps {
  onTakeOver: (convo: Conversation) => void;
}

const LeadsNeedingResponseDialog: React.FC<LeadsNeedingResponseDialogProps> = ({
  onTakeOver,
}) => {
  const [conversations] = useState(dummyConversations);
  const handoffConversations = conversations.filter(
    (c) => c.status === "Needs Attention"
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="lg:col-span-1 cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leads Needing Response
            </CardTitle>
            <Hand className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{handoffConversations.length}</div>
            <p className="text-xs text-muted-foreground">
              Conversations needing your attention
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Leads Needing Response</DialogTitle>
          <DialogDescription>
            These conversations were flagged by the AI for your expert handling.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Reason for Handoff</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {handoffConversations.map((convo) => (
                <TableRow key={convo.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{convo.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{convo.customer}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-sm truncate">
                    {convo.lastMessage}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {channelIcons[convo.channel]}
                      {convo.channel}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => onTakeOver(convo)}>
                      Take Over
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadsNeedingResponseDialog;
