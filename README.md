# RestaurantOS - Complete Restaurant Management System

A comprehensive restaurant management system built with Next.js, featuring Firebase authentication, Google Sheets integration, and AI-powered chatbot assistance.

## 🚀 Features

### Core Management
- **Dashboard**: Real-time analytics and overview
- **Menu Management**: Add, edit, and manage menu items with image uploads
- **Customer Management**: Complete customer database with order history
- **Order Management**: Full order lifecycle with status tracking
- **Inventory Management**: Stock tracking with low-stock alerts
- **Staff Management**: Employee records, attendance, and role management

### Advanced Features
- **Firebase Authentication**: Secure login with email/password and Google OAuth
- **Google Sheets Integration**: Sync all restaurant data to connected sheets
- **AI Chatbot**: n8n-powered automation for data management and quick actions
- **Multi-Currency Support**: Support for multiple currencies including Indian Rupee
- **Real-time Updates**: Live data synchronization across all components
- **Responsive Design**: Mobile-first design with premium black & purple theme

### Technical Stack
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion animations
- **Authentication**: Firebase Auth
- **State Management**: Zustand
- **UI Components**: shadcn/ui, Lucide Icons
- **Automation**: n8n webhook integration

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- Firebase project
- Google Sheets (optional)
- n8n instance (optional)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration in `lib/firebase.ts`
4. Configure environment variables
5. Run development server: `npm run dev`

### Environment Variables
Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: n8n Webhook URL
NEXT_PUBLIC_N8N_WEBHOOK=your_n8n_webhook_url
```

### Supabase Setup
1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to Settings → API to get your project URL and anon key
3. Add these to your `.env.local` file
4. Go to Authentication → Providers → Google and enable Google OAuth
5. Add your Google OAuth credentials from Google Cloud Console
6. Set the redirect URL to: `https://your-domain.com/auth/callback`
## 📱 Usage Guide

### Getting Started
1. **Sign Up/Login**: Create account or login with existing credentials
2. **Setup Profile**: Complete your restaurant profile information
3. **Connect Google Sheets**: Optional - sync data to external sheets
4. **Add Initial Data**: Start with menu items, customers, and staff

### Daily Operations
- **Take Orders**: Use the orders page to create and manage orders
- **Track Inventory**: Monitor stock levels and receive low-stock alerts
- **Manage Staff**: Track attendance and manage employee information
- **View Analytics**: Monitor sales, customer trends, and performance

### AI Assistant
- **Quick Actions**: Use chatbot for rapid data entry
- **Google Sheets Sync**: Automated data synchronization
- **Currency Conversion**: Real-time currency calculations
- **Data Queries**: Ask questions about your restaurant data

## 🔧 Free Storage Recommendations

### Database Options
1. **Supabase** (Recommended)
   - Free tier: 500MB database, 50MB file storage
   - Built-in authentication and real-time features
   - PostgreSQL with REST API

2. **Firebase Firestore**
   - Free tier: 1GB storage, 50K reads/day
   - Real-time synchronization
   - Integrated with existing Firebase auth

3. **PlanetScale**
   - Free tier: 1 database, 1GB storage
   - MySQL-compatible with branching
   - Serverless architecture

### File Storage Options
1. **Vercel Blob** (Recommended for images)
   - Generous free tier
   - Integrated with Vercel deployment
   - CDN-optimized delivery

2. **Cloudinary**
   - Free tier: 25GB storage, 25GB bandwidth
   - Image optimization and transformation
   - Easy integration

### Deployment Options
1. **Vercel** (Recommended)
   - Free tier with custom domains
   - Automatic deployments from Git
   - Built-in analytics and monitoring

2. **Netlify**
   - Free tier with 100GB bandwidth
   - Form handling and serverless functions
   - Git-based deployments

## 🎯 Production Checklist

- ✅ Firebase authentication configured
- ✅ Responsive design implemented
- ✅ Error handling and loading states
- ✅ Data validation and sanitization
- ✅ SEO optimization
- ✅ Performance optimization
- ✅ Security best practices
- ✅ Cross-browser compatibility
- ✅ Accessibility features
- ✅ Progressive Web App features

## 🔐 Security Features

- Firebase Authentication with email verification
- Protected routes with authentication guards
- Input validation and sanitization
- Secure API endpoints
- CORS configuration
- Environment variable protection

## 📊 Analytics & Monitoring

- Real-time dashboard metrics
- Customer behavior tracking
- Sales performance analytics
- Inventory level monitoring
- Staff attendance tracking
- Revenue trend analysis

## 🤝 Support

For technical support or feature requests:
1. Check the documentation
2. Use the built-in AI chatbot for quick help
3. Review the troubleshooting guide
4. Contact support team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**RestaurantOS** - Streamlining restaurant operations with modern technology.
