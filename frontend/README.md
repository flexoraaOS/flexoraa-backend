# Flexoraa Intelligence OS

Flexoraa Intelligence OS is a full-stack AI-powered business automation platform built with modern web technologies. It consists of two main modules: **LeadOS** (for lead management and sales automation) and **AgentOS** (for AI-driven customer engagement).

## 🚀 Features

### LeadOS Module
- AI-powered lead verification and qualification
- WhatsApp integration for automated outreach
- Gamified SDR leaderboards
- Revenue forecasting and campaign intelligence
- CSV upload and bulk lead processing

### AgentOS Module
- Omnichannel conversational AI (Instagram, Facebook, WhatsApp)
- Unified inbox for customer conversations
- AI-driven sales and appointment booking
- Performance analytics and ROI tracking

### Shared Features
- User authentication with role-based access (Owner vs SDR)
- Dashboard analytics and reporting
- Payment integration (Razorpay)
- Email notifications (Resend)
- File upload and storage (Supabase)

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit with feature-based slices
- **Backend**: Supabase (PostgreSQL database + Auth + Storage)
- **Integrations**: n8n workflows, Resend email service, Razorpay payments
- **AI**: Google Generative AI, custom AI components for messaging and analysis
- **UI Components**: Radix UI, Lucide icons, Framer Motion animations

## 📁 Project Structure

The project follows a **feature-based folder structure** with Next.js App Router:
- `/frontend/src/app/` - Route-based pages and layouts
- `/frontend/src/lib/` - Redux store, API utilities, and business logic
- `/frontend/src/components/` - Reusable UI components
- Two main modules: `leados/` (Owner/SDR lead management) and `agentos/` (SDR conversational AI)

## 🏗️ Database Schema

The Supabase database includes tables for:
- `profiles` - User profiles extending auth.users
- `campaigns` - Marketing campaigns
- `leads` - Lead data with status tracking and metadata
- `contact_history` - Communication logs
- `contacts` & `feedback` - Public forms

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project
- Environment variables configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/flexoraa.git
cd flexoraa/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_RESEND_API_KEY=your_resend_api_key
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Testing

The project includes comprehensive test scripts:

- Test Gmail SMTP configuration:
```bash
node test-gmail.js
```

## 📚 Additional Documentation

- [Gmail SMTP Setup](./GMAIL_SMTP_SETUP.md) - Detailed instructions for setting up Gmail SMTP for email notifications
- [TODO List](./TODO-updated.md) - Current development tasks and implementation details

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the existing documentation
2. Search existing issues on GitHub
3. Create a new issue with detailed information

## 📈 Current Status

The project is in active development with:
- ✅ Completed forgot password implementation (OTP-based)
- ✅ Database migration scripts ready
- ✅ Marketing landing page with testimonials
- ✅ Authentication system with Supabase
- ✅ Basic dashboard structure
