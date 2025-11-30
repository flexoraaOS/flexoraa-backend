"use client"
import React, { useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { motion, Variants } from 'framer-motion'
import { gsap } from 'gsap'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

interface ContactInfoCardProps {
  icon: React.ReactNode
  title: string
  detail: string
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 20 }
  }
}

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ icon, title, detail }) => {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cardEl = cardRef.current
    if (!cardEl) return

    const onMouseEnter = () => {
      gsap.to(cardEl, { y: -8, boxShadow: '0px 20px 30px rgba(229, 62, 62, 0.2)', duration: 0.3, ease: 'power2.out' })
    }
    const onMouseLeave = () => {
      gsap.to(cardEl, { y: 0, boxShadow: '0px 0px 0px rgba(0,0,0,0)', duration: 0.3, ease: 'power2.out' })
    }

    cardEl.addEventListener('mouseenter', onMouseEnter)
    cardEl.addEventListener('mouseleave', onMouseLeave)
    return () => {
      cardEl.removeEventListener('mouseenter', onMouseEnter)
      cardEl.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <motion.div ref={cardRef} variants={itemVariants} className="bg-card border border-border p-6 rounded-lg flex items-start space-x-4">
      <div className="bg-red-600/20 p-3 rounded-full">{icon}</div>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{detail}</p>
      </div>
    </motion.div>
  )
}

export default function ContactPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <section className="py-20 md:py-28 " id='animated-background'>
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, type: 'spring' }} className="text-4xl md:text-6xl font-bold tracking-tighter">
            Contact Us & <span className="bg-gradient-to-r from-red-600 via-orange-400 to-red-700 bg-clip-text text-transparent whitespace-nowrap">Get in Touch</span>
          </motion.h1>
          <motion.p initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2, type: 'spring' }} className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
            Have a question, a project idea, or just want to talk about the future of AI? We&apos;d love to hear from you.
          </motion.p>
        </div>
      </section>
      <section className="py-20 md:py-24 bg-background">
        <motion.div className="container max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <div className="space-y-8">
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-foreground">Contact Information</h2>
              <p className="text-muted-foreground mt-2">Fill up the form and our team will get back to you within 24 hours.</p>
            </motion.div>
            <ContactInfoCard icon={<Phone className="h-6 w-6 text-red-400" />} title="Phone" detail="+91 6290624068" />
            <ContactInfoCard icon={<Mail className="h-6 w-6 text-red-400" />} title="Email" detail="flexoraa.mfg@gmail.com" />
            <ContactInfoCard icon={<MapPin className="h-6 w-6 text-red-400" />} title="Location" detail="Kolkata, India" />
          </div>
          <motion.div variants={itemVariants} className="bg-card border border-border p-8 rounded-lg">
            <form className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</label>
                <input type="text" id="name" name="name" className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                <input type="email" id="email" name="email" className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                <input type="text" id="subject" name="subject" className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="Regarding LeadOS..." />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                <textarea id="message" name="message" rows={5} className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 transition" placeholder="Your message here..."></textarea>
              </div>
              <div>
                <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg group">
                  Send Message <Send className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
