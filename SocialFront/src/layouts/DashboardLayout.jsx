import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Box } from '@mui/material';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingButtons from "./floatingButton";

// Removed unused imports admission, enquiry, BASE_URL

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar((prev) => !prev);

  const buttonsList = [
    { onClick: () => navigate('/admin/add-Lead'), label: "Enquiry" },
    { onClick: () => navigate('/admin/addNewAdd'), label: "Admission" },
    { onClick: () => navigate('/admin/addReciept'), label: "Receipt" },
    { onClick: () => navigate('/admin/addPayment'), label: "Payment" },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Navbar toggleSidebar={toggleSidebar} />
          <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, pt: 12, pb: 8, overflowY: 'auto' }}>
              <Outlet />
            </Box>
          </Box>
        </Box>
        <FloatingButtons buttonType="bars" buttonsList={buttonsList} direction="up" />
      </Box>
      <Footer />
    </>
  );
}
