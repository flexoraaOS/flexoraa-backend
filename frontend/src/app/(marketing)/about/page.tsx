'use client';

import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AnimatedCta from '@/components/AnimatedCta';
import {
  MessageSquare, Info, Zap, Target, Users, Star, ThumbsUp, AlertCircle, Bug, Lightbulb,
  TrendingUp, Clock, CheckCircle, Award, Rocket, Cpu, BarChart3, Globe,
  Quote, ArrowRight, PlayCircle, Calendar, Mail, Phone
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { resetStatus, submitFeedback, selectFeedbackState } from '@/lib/features/feedbackSlice';

// The teamMembers array was unused and has been removed.

export default function AboutPage() {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector(selectFeedbackState);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');

  // Reset status when the component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetStatus());
    };
  }, [dispatch]);

  // Explicitly type the event parameter for the form handler
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'loading') return;
    dispatch(submitFeedback({ name, email, feedback }));
  };

  return (
    // The main container now uses Tailwind classes for theme support.
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      {/* The animated-background class has been replaced with Tailwind's gradient utilities for a reddish theme. */}
      <section className="py-20 md:py-28 " id='animated-background'>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            {/* The gradient-text class is now implemented with Tailwind utilities. */}
            About & <span className="bg-gradient-to-r from-red-500 via-yellow-600 to-yellow-300 bg-clip-text text-transparent">Feedback</span>
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
            We are pioneers in AI-driven business automation, committed to building intelligent systems that empower companies to achieve unprecedented growth and efficiency. Your feedback helps us build better.
          </p>
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="about" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-12 h-12 bg-muted/50">
              <TabsTrigger
                value="about"
                className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all duration-200"
              >
                <Info className="w-4 h-4" />
                About Us
                <Badge variant="secondary" className="ml-2 text-xs">Learn More</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4" />
                Share Feedback
                <Badge variant="outline" className="ml-2 text-xs border-red-200 text-red-600">Important</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-8 mt-8">
              {/* About Content */}
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    <span>Welcome to the future of AI automation</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                    Pioneering AI-Driven Business Solutions
                  </h2>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-4 text-lg text-muted-foreground">
                        <p className="text-center text-xl font-medium">
                            🎯 Mission Statement
                        </p>
                        <p>
                            Flexoraa Intelligence OS is building a full-stack AI ecosystem designed to eliminate human error, slash operational costs, and automate growth — without the bloat or overhead of traditional systems.
                        </p>
                        <blockquote className="border-l-4 border-red-500 pl-6 py-4 my-8 italic text-foreground/90 text-xl font-medium bg-muted/30 rounded-r-lg">
                            <div className="flex items-start gap-3">
                              <Target className="w-6 h-6 mt-1 text-red-500 flex-shrink-0" />
                              <div>
                                &ldquo;What if your entire lead engine and customer ops could run on intelligent agents that never sleep, never forget, and always perform?&rdquo;
                              </div>
                            </div>
                        </blockquote>
                        <p>
                            We're executing that idea — fast.
                        </p>
                    </div>
                  </div>

                  <hr className="border-border" />

                  <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Zap className="w-6 h-6 text-red-500" />
                        The First Wave: LeadOS + AgentOS
                      </h3>
                      <p className="text-lg text-muted-foreground">We launched with two cutting-edge AI models:</p>
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                              <Badge variant="secondary">LeadOS</Badge>
                            </CardTitle>
                            <CardDescription>Your intelligent lead qualification system</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  Filters out junk leads using number verification
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  Qualifies leads into Hot, Warm, or Cold buckets
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  Automated WhatsApp messaging system
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  Smart conversion attempts for disinterested leads
                                </li>
                            </ul>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                              <Badge variant="secondary">AgentOS</Badge>
                            </CardTitle>
                            <CardDescription>Your digital sales development representative</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  Handles unlimited queries and conversations
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  Engages prospects and books meetings
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  Sends alerts and notifications
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  Seamlessly syncs with your sales team
                                </li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                      <p className="text-lg text-muted-foreground text-center italic bg-muted/30 rounded-lg p-4">
                          Together, they form the first plug-and-play lead automation stack—cutting your cost per conversion, reducing wasted team hours, and giving you total visibility over your pipeline.
                      </p>
                  </div>

                  <hr className="border-border" />

                  <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Users className="w-6 h-6 text-red-500" />
                        The Bigger Mission: An AI Army for Your Business
                      </h3>
                      <p className="text-lg text-muted-foreground">LeadOS and AgentOS are just the beginning.</p>
                      <p className="text-lg text-muted-foreground">
                          We are building 10+ powerful AI models under Flexoraa Intelligence OS, each engineered to automate a specific department — from lead generation to operations — all working together to reduce human error, cut costs, and scale faster.
                      </p>
                       <blockquote className="border-l-4 border-red-500 pl-6 py-4 my-6 italic text-foreground/90 text-xl font-medium bg-gradient-to-r from-red-50/50 to-yellow-50/50 dark:from-red-950/20 dark:to-yellow-950/20 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <Star className="w-6 h-6 mt-1 text-yellow-500 flex-shrink-0" />
                            <div>
                              All Flexoraa Agents will talk to each other — sharing data, learning patterns, and optimizing in real time. No silos. No disconnects. Just one intelligent system that works for your team, not the other way around.
                            </div>
                          </div>
                      </blockquote>
                  </div>

                  <hr className="border-border" />

                  <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Target className="w-6 h-6 text-red-500" />
                        Why We're Doing This
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-4 bg-red-50/50 dark:bg-red-950/20 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">The Problem</p>
                              <p className="text-sm text-muted-foreground mt-1">Most businesses run on outdated tools, bloated CRMs, and teams stretched thin trying to manage leads.</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-4 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">The Solution</p>
                              <p className="text-sm text-muted-foreground mt-1">Flexoraa Intelligence OS gives you control, speed, and precision. Less cost. Less error. More qualified action.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-lg text-muted-foreground text-center italic bg-muted/30 rounded-lg p-4">
                          Whether you are a sales-heavy startup or an enterprise drowning in data, we are the AI operating system your business needed — and never had.
                      </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-8 mt-8">
              {/* Feedback Content */}
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8 space-y-4">
                  <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Your opinion matters</span>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
                    Share Your <span className="bg-gradient-to-r from-red-500 via-yellow-600 to-yellow-300 bg-clip-text text-transparent">Feedback</span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Help us build a better Flexoraa Intelligence OS. Your insights drive our innovation.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: ThumbsUp, label: "Like" },
                    { icon: Lightbulb, label: "Suggestions" },
                    { icon: Bug, label: "Report Issues" },
                    { icon: Star, label: "Praise" }
                  ].map((item, index) => (
                    <Card key={index} className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4">
                        <item.icon className="w-8 h-8 mx-auto mb-2 text-red-500" />
                        <p className="text-sm font-medium">{item.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-card text-foreground shadow-xl border-2 border-border/50">
                  <form onSubmit={handleSubmit}>
                    <CardHeader className="text-center space-y-2">
                      <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                        <MessageSquare className="w-5 h-5 text-red-500" />
                        Feedback Form
                      </CardTitle>
                      <CardDescription>Your insights help us build a better platform for everyone.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {status === 'succeeded' ? (
                        <div className="text-center p-8 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                              <ThumbsUp className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Thank You!</h3>
                          <p className="text-foreground">Your feedback has been submitted successfully. We appreciate your input!</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Full Name
                              </Label>
                              <Input
                                id="name"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Email Address
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="feedback" className="flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" />
                              Your Feedback
                            </Label>
                            <Textarea
                              id="feedback"
                              placeholder="Tell us what you think, what we can improve, or any issues you've encountered..."
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              required
                              className="min-h-[120px] resize-y"
                              rows={5}
                            />
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Be as detailed as you'd like — we read every response carefully
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                    {status !== 'succeeded' && (
                      <CardFooter className="flex flex-col items-center space-y-4 pt-0">
                        <Button
                          type="submit"
                          className="w-full h-12 text-base font-medium"
                          variant="red"
                          disabled={status === 'loading'}
                        >
                          {status === 'loading' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Submitting Feedback...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Submit Feedback
                            </>
                          )}
                        </Button>
                        {status === 'failed' && (
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Error: {error || 'Something went wrong. Please try again.'}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground text-center">
                          We typically respond within 24 hours. Your feedback helps us build better AI solutions for everyone.
                        </p>
                      </CardFooter>
                    )}
                  </form>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-r from-red-50/30 via-yellow-50/30 to-red-50/30 dark:from-red-950/10 dark:via-yellow-950/10 dark:to-red-950/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              By the Numbers
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real results from businesses using Flexoraa Intelligence OS
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "500+", label: "Active Users", icon: Users, color: "text-blue-600" },
              { value: "85%", label: "Time Saved", icon: Clock, color: "text-green-600" },
              { value: "3x", label: "Lead Growth", icon: TrendingUp, color: "text-red-600" },
              { value: "99.9%", label: "Uptime", icon: CheckCircle, color: "text-yellow-600" }
            ].map((stat, index) => (
              <Card key={index} className="text-center bg-white/50 dark:bg-gray-900/50 border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Users Say
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real feedback from businesses transforming their operations with AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                role: "CEO, TechStart Inc.",
                avatar: "SC",
                quote: "Flexoraa reduced our lead qualification time by 75%. Our sales team can now focus on closing deals instead of lead hunting.",
                rating: 5
              },
              {
                name: "Marcus Rodriguez",
                role: "Operations Director, GrowthCo",
                avatar: "MR",
                quote: "The AI automation has eliminated human errors and our conversion rates have doubled. Absolutely game-changing.",
                rating: 5
              },
              {
                name: "Emma Thompson",
                role: "Sales Manager, InnovateLabs",
                avatar: "ET",
                quote: "AgentOS handles customer inquiries 24/7. Our response time went from 24 hours to instant. Perfect!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-red-500 mb-4 opacity-50" />
                  <p className="text-foreground mb-6 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Future Timeline Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
              <Rocket className="w-8 h-8 text-red-500" />
              Our Roadmap
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The future of intelligent business automation is here
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-0.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-yellow-500 to-red-500"></div>

              {[
                {
                  phase: "Phase 1",
                  title: "LeadOS + AgentOS",
                  status: "Launched",
                  description: "Intelligent lead qualification and automated customer engagement systems.",
                  icon: Zap,
                  color: "text-green-600"
                },
                {
                  phase: "Phase 2",
                  title: "FinanceOS & HR-OS",
                  status: "Q1 2025",
                  description: "Automated financial operations and intelligent HR management systems.",
                  icon: Cpu,
                  color: "text-blue-600"
                },
                {
                  phase: "Phase 3",
                  title: "MarketOS & Analytics",
                  status: "Q3 2025",
                  description: "Real-time market intelligence and comprehensive analytics suites.",
                  icon: BarChart3,
                  color: "text-purple-600"
                },
                {
                  phase: "Phase 4",
                  title: "Global Integration",
                  status: "2026",
                  description: "Seamless integration with 1000+ apps and worldwide multi-language support.",
                  icon: Globe,
                  color: "text-orange-600"
                }
              ].map((item, index) => (
                <div key={index} className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Timeline dot */}
                  <div className={`absolute left-8 md:left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-red-500 z-10`}></div>

                  {/* Content card */}
                  <div className={`ml-16 md:ml-0 md:w-5/12 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                    <Card className="shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                            <item.icon className={`w-6 h-6 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={item.phase === "Phase 1" ? "default" : "secondary"}>
                                {item.phase}
                              </Badge>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === "Launched" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                            <p className="text-muted-foreground text-sm">{item.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-red-50/30 dark:from-blue-950/10 dark:via-purple-950/10 dark:to-red-950/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get In Touch
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Have questions? Want a demo? We're here to help you transform your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8">
                <Mail className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h4 className="text-lg font-semibold mb-2">Email Us</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Get detailed responses and technical support
                </p>
                <Button variant="outline" size="sm">
                  hello@flexoraa.com
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h4 className="text-lg font-semibold mb-2">Book a Demo</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  See our AI solutions in action
                </p>
                <Button variant="outline" size="sm">
                  Schedule Call
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h4 className="text-lg font-semibold mb-2">Live Chat</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Instant help from our support team
                </p>
                <Button variant="outline" size="sm">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="py-20 " id='animated-background'>
      <AnimatedCta
        title="Ready to Supercharge Your Sales?"
        subtitle="Get started with LeadOS & AgentOS today and turn more prospects into profits."
        buttonText="View Plans"
        buttonLink="/pricing"
      />
      </section>
    </div>
  );
}
