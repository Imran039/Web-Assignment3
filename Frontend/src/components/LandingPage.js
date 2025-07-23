import React, { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import OrganizerPanel from "./OrganizerPanel";
import UserDashboard from "./UserDashboard";
import Logo from "./Logo";

const LandingPage = ({
  userRole = "user",
  userName = "User",
  user,
  onLogout,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const renderRoleBasedView = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;
      case "organizer":
        return <OrganizerPanel user={user} />;
      case "user":
        return <UserDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "organizer":
        return "Event Organizer";
      case "user":
        return "Event Attendee";
      default:
        return "User";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 w-full">
        <div className="w-full md:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-2 sm:py-0 gap-2 sm:gap-0">
            <div className="flex items-center space-x-3">
              <Logo size={40} />
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="text-center sm:text-right">
                <p className="text-xs sm:text-sm text-slate-600">
                  Welcome back,
                </p>
                <p className="text-sm font-medium text-slate-800 text-right w-full">
                  {userName}
                </p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-slate-700">
                  {getRoleDisplayName(userRole)}
                </span>
              </div>
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="ml-0 sm:ml-4 px-3 sm:px-4 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium w-full sm:w-auto"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full md:max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderRoleBasedView()
        )}
      </main>
    </div>
  );
};

export default LandingPage;
