import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const FeaturesPage = lazy(() => import("./pages/marketing/FeaturesPage"));
const PricingPage = lazy(() => import("./pages/marketing/PricingPage"));
const TeamsPage = lazy(() => import("./pages/marketing/TeamsPage"));
const AboutPage = lazy(() => import("./pages/marketing/AboutPage"));
const BlogPage = lazy(() => import("./pages/marketing/BlogPage"));
const ContactPage = lazy(() => import("./pages/marketing/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/marketing/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/marketing/TermsPage"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const CardRoute = lazy(() => import("./pages/CardRoute"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const DashboardOverview = lazy(() => import("./pages/dashboard/DashboardOverview"));
const EditProfile = lazy(() => import("./pages/dashboard/ProfileStudioProfessional"));
const Links = lazy(() => import("./pages/dashboard/Links"));
const Appearance = lazy(() => import("./pages/dashboard/Appearance"));
const MyCard = lazy(() => import("./pages/dashboard/MyCard"));
const Analytics = lazy(() => import("./pages/dashboard/Analytics"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const ReceivedContacts = lazy(() => import("./pages/dashboard/ReceivedContacts"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminCompanies = lazy(() => import("./pages/admin/AdminCompanies"));
const AdminCards = lazy(() => import("./pages/admin/AdminCards"));
const AdminCardView = lazy(() => import("./pages/admin/AdminCardView"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCustomerView = lazy(() => import("./pages/admin/AdminCustomerView"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminUserView = lazy(() => import("./pages/admin/AdminUserView"));
const AdminCompanyView = lazy(() => import("./pages/admin/AdminCompanyView"));
const CompanyLayout = lazy(() => import("./pages/company/CompanyLayout"));
const CompanyOverview = lazy(() => import("./pages/company/CompanyOverview"));
const EmployeeManagement = lazy(() => import("./pages/company/EmployeeManagement"));
const CardManagement = lazy(() => import("./pages/company/CardManagement"));
const InvitationManagement = lazy(() => import("./pages/company/InvitationManagement"));
const CompanySettings = lazy(() => import("./pages/company/CompanySettings"));
const CompanyAnalytics = lazy(() => import("./pages/company/CompanyAnalytics"));
const TeamDashboard = lazy(() => import("./pages/TeamDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/for-teams" element={<TeamsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/card/:code" element={<CardRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<EditProfile />} />
              <Route path="links" element={<Links />} />
              <Route path="appearance" element={<Appearance />} />
              <Route path="card" element={<MyCard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="contacts" element={<ReceivedContacts />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="companies/:companyId" element={<AdminCompanyView />} />
              <Route path="cards" element={<AdminCards />} />
              <Route path="cards/:cardId" element={<AdminCardView />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:userId" element={<AdminUserView />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="customers/:userId" element={<AdminCustomerView />} />
            </Route>

            <Route path="/company" element={<CompanyLayout />}>
              <Route index element={<CompanyOverview />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="cards" element={<CardManagement />} />
              <Route path="invitations" element={<InvitationManagement />} />
              <Route path="analytics" element={<CompanyAnalytics />} />
              <Route path="settings" element={<CompanySettings />} />
            </Route>

            <Route path="/team" element={<TeamDashboard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
