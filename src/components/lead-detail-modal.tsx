import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Calendar, User, Building, Globe, MessageSquare, Target, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company?: string;
  website?: string;
  problem_text: string;
  score?: number;
  band?: string;
  label?: string;
  status: string;
  model_rationale?: string;
  company_size?: string;
  industry?: string;
}

interface LeadEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
}

interface LeadDetailModalProps {
  lead: Lead | null;
  events: LeadEvent[];
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (leadId: string, newStatus: string) => void;
}

export function LeadDetailModal({ lead, events, isOpen, onClose, onStatusUpdate }: LeadDetailModalProps) {
  const [isSendingOutreach, setIsSendingOutreach] = useState(false);
  const { toast } = useToast();

  if (!lead) return null;

  const handleSendOutreach = async () => {
    setIsSendingOutreach(true);
    try {
      // TODO: Replace with actual N8N_WEBHOOK_OUTREACH URL
      const response = await fetch('https://your-n8n-webhook-outreach-url.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lead_id: lead.id }),
      });

      if (response.ok) {
        // Update lead status to 'contacted'
        const { error } = await supabase
          .from('leads')
          .update({ status: 'contacted' })
          .eq('id', lead.id);

        if (!error) {
          // Add outreach event
          await supabase
            .from('lead_events')
            .insert({
              lead_id: lead.id,
              event_type: 'outreach_sent',
              event_data: { channel: 'email', timestamp: new Date().toISOString() }
            });

          onStatusUpdate(lead.id, 'contacted');
          toast({
            title: "Outreach sent successfully",
            description: `Outreach has been sent to ${lead.name}`,
          });
        }
      } else {
        throw new Error('Failed to send outreach');
      }
    } catch (error) {
      toast({
        title: "Failed to send outreach",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSendingOutreach(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'lead_captured': return <User className="h-4 w-4" />;
      case 'lead_scored': return <TrendingUp className="h-4 w-4" />;
      case 'outreach_sent': return <Send className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {lead.name}
            <Badge variant={lead.status === 'new' ? 'secondary' : lead.status === 'contacted' ? 'default' : 'outline'}>
              {lead.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <strong>Email:</strong> {lead.email}
                  </div>
                  {lead.company && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <strong>Company:</strong> {lead.company}
                    </div>
                  )}
                  {lead.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <strong>Website:</strong> 
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {lead.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Problem Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Problem Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{lead.problem_text}</p>
                </CardContent>
              </Card>

              {/* Model Rationale */}
              {lead.model_rationale && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Model Rationale
                    </CardTitle>
                    <CardDescription>
                      AI-generated analysis of this lead
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{lead.model_rationale}</p>
                  </CardContent>
                </Card>
              )}

              {/* Enrichment Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrichment Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.company_size && (
                    <div>
                      <strong>Company Size:</strong> {lead.company_size}
                    </div>
                  )}
                  {lead.industry && (
                    <div>
                      <strong>Industry:</strong> {lead.industry}
                    </div>
                  )}
                  {lead.score && (
                    <div className="flex items-center gap-2">
                      <strong>Score:</strong> {lead.score}/100
                      {lead.band && (
                        <Badge variant={lead.band === 'High' ? 'default' : lead.band === 'Medium' ? 'secondary' : 'outline'}>
                          {lead.band}
                        </Badge>
                      )}
                    </div>
                  )}
                  {lead.label && (
                    <div>
                      <strong>Label:</strong> {lead.label}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleSendOutreach}
                    disabled={isSendingOutreach || lead.status === 'contacted'}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSendingOutreach ? 'Sending...' : 'Send Outreach'}
                  </Button>
                  {lead.status === 'contacted' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Outreach already sent
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Event Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="p-2 rounded-full bg-muted">
                            {getEventIcon(event.event_type)}
                          </div>
                          {index < events.length - 1 && (
                            <div className="w-px h-8 bg-border mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {formatEventType(event.event_type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                          {event.event_data && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(event.event_data, null, 2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}