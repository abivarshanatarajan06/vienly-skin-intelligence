import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SkinProfile from "./pages/SkinProfile";
import Lifestyle from "./pages/Lifestyle";
import SkinAssessment from "./pages/SkinAssessment";
import Recommendations from "./pages/Recommendations";
import SleepTracking from "./pages/SleepTracking";
import DermatologistDashboard from "./pages/DermatologistDashboard";
import PatientDetails from "./pages/PatientDetails";
import PatientReport from "./pages/PatientReport";
import Progress from "./pages/Progress";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Routine from "./pages/Routine";
import IngredientChecker from "./pages/IngredientChecker";


function App() {
return (
<BrowserRouter>
<Routes>
{/* Home */}
<Route path="/" element={<Home />} />

    {/* Authentication */}
    <Route path="/register" element={<Register />} />
    <Route path="/login" element={<Login />} />

    {/* Patient Onboarding */}
    <Route path="/onboarding" element={<Onboarding />} />

    {/* Patient Dashboard */}
    <Route path="/dashboard" element={<Dashboard />} />

    

    {/* Patient Information */}
    <Route path="/skin-profile" element={<SkinProfile />} />
    <Route path="/lifestyle" element={<Lifestyle />} />
    <Route path="/sleep-tracking" element={<SleepTracking />} />

    {/* Skin Intelligence */}
    <Route path="/skin-assessment" element={<SkinAssessment />} />
    <Route
      path="/recommendations"
      element={<Recommendations />}
    />
    <Route
      path="/ingredient-checker"
      element={<IngredientChecker />}
    />

    {/* Personalized Skincare Routine */}
    <Route path="/routine" element={<Routine />} />

    {/* Progress and Analytics */}
    <Route path="/progress" element={<Progress />} />
    <Route path="/analytics" element={<Analytics />} />

    {/* Notifications */}
    <Route path="/notifications" element={<Notifications />} />

    {/* Dermatologist Dashboard */}
    <Route
      path="/dermatologist-dashboard"
      element={<DermatologistDashboard />}
    />

    {/* Patient Details */}
    <Route
      path="/patient/:user_id"
      element={<PatientDetails />}
    />

    {/* Patient Report */}
    <Route
      path="/patient/:user_id/report"
      element={<PatientReport />}
    />
  </Routes>
</BrowserRouter>

);
}

export default App;