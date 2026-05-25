import { useState, useEffect, useRef } from "react";
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from "react-router-dom";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import UserMenu from './navbar/UserMenu';
import apiClient from '../apiClient';

import {
  FiMenu,
  FiUser,
  FiChevronRight,
  FiChevronDown,
  FiLogOut,
  FiUsers,
  FiBox,
  FiCheckSquare,
  FiUserCheck,
  FiShoppingCart,
  FiHelpCircle,
  FiDollarSign,
  FiRepeat,
  FiMoreHorizontal,
  FiUpload,
  FiMessageCircle,
  FiEdit,
} from "react-icons/fi";

const Navbar = () => {
  const { user, institute, loading } = useApp();
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceState, setAttendanceState] = useState(null);
  const [showButtons, setShowButtons] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const currentUsername = location.pathname.split('/').filter(Boolean)[0] || 'admin';
  const dropdownRef = useRef();

const username = user?.name || 'User';
  const role = user?.role || '';

useEffect(() => {
  if (user?.name) {
    setUserName(user.name);
  }
}, [user]);

    useEffect(() => {
              if (userName) {
                  initAttendanceState(userName);
              }
          }, [userName]);

          const initAttendanceState = async (userName) => {
        if (!userName) return;

        try {
            const response = await apiClient.get(`/api/attendance/getTodayAttendance/${userName}`);
            const data = response.data;

            if (!data.success || !Array.isArray(data.flow)) {
                setAttendanceState("In");
                return;
            }

            const flow = data.flow;
            const sequence = ["In", "Break", "Start", "Out"];
            const nextStep = sequence.find(step => !flow.includes(step));

            if (flow.includes("Out")) {
                setAttendanceState(null)
            } else {
                setAttendanceState(nextStep || null);
            }
        } catch (error) {
            console.error("Failed to fetch attendance state:", error);
            setAttendanceState("In");
        } finally {
            setShowButtons(true);
        }
    };


  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuGroups = [
    {
      group: "Student",
      icon: FiUsers,
      items: [
        { label: "Add Student", path: "/student" },
      ],
    },
    {
      group: "Course",
      icon: FiBox,
      items: [
        { label: "Course Report", path: "/dashboard/Courses" },
      ],
    },
    {
      group: "Batche",
      icon: FiCheckSquare,
      items: [
        { label: "Batch Report", path: "/dashboard/Batches" },
        { label: "Manage Batch", path: "/dashboard/allbatches" }
      ],
    },
    {
      group: "User",
      icon: FiUserCheck,
      items: [
        { label: "User Report", path: "/dashboard/user" },
      ],
    },
    {
      group: "Exam",
      icon: FiShoppingCart,
      items: [
        { label: "Exam Report", path: "/dashboard/exam" },
        { label: "Manage Exam", path: "/dashboard/allexams" }
      ],
    },
    {
      group: "Education",
      icon: FiHelpCircle,
      items: [
        { label: "Education Report", path: "/dashboard/education" },
      ],
    },
    {
      group: "Profile",
      icon: FiDollarSign,
      items: [
        { label: "Institute Profile", path: "/dashboard/instituteProfile" },
      ],
    },
    {
      group: "Integrations",
      icon: FiRepeat,
      items: [
        { label: "WhatsApp Integration", path: `/${currentUsername}/dashboard/centers/${localStorage.getItem('institute_uuid') || ''}/whatsapp` },
        { label: "WhatsApp (Personal QR)", path: `/${currentUsername}/whatsapp-personal` },
        { label: "UPI Payment", path: `/${currentUsername}/upi-payment` },
      ],
    },
    {
      group: "Tools",
      icon: FiEdit,
      items: [
        { label: "Canvas Editor", path: `/${currentUsername}/canvas-editor` },
        { label: "CSV Import", path: `/${currentUsername}/csv-import` },
        { label: "Bulk Download (ZIP)", path: `/${currentUsername}/bulk-download` },
      ],
    },
  ];

  const toggleGroup = (groupName) => {
    setOpenGroup(prev => (prev === groupName ? null : groupName));
  };

  return (
    <>
     <div className="fixed top-0 w-full bg-blue-600 text-white px-4 py-2 flex justify-between items-center z-50 shadow-md">
  <button
    onClick={() => navigate("/Home")}
  >
    {/* Title text is white by default now */}
    <h1 className="text-xl font-bold uppercase">SANJU SK</h1>
  </button>

  <div className="flex items-center gap-4 relative" ref={dropdownRef}>
    <button
      className="flex items-center gap-2 focus:outline-none"
      onClick={() => {
        const token = localStorage.getItem("authToken");
        if (token) {
          window.location.href = `https://canvas-gray-five.vercel.app/api/auth?token=${encodeURIComponent(token)}`;
        } else {
          window.location.href = "https://canvas-gray-five.vercel.app";
        }
      }}
    >
      {/* Circle stays light for contrast */}
      <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded text-lg font-bold text-blue-700">
        F
      </div>
    </button>

       {/* 3. User Icon */}
          <button
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <AccountCircleIcon className="text-3xl text-white-500" />
          </button>

          {showUserMenu && (
            <UserMenu
              username={username}
              role={role}
              showButtons={showButtons}
              attendanceState={attendanceState}
              userName={userName}
              setShowButtons={setShowButtons}
              onClose={() => setShowUserMenu(false)}
            />
          )}

    <button
      onClick={() => {
        setShowDropdown(prev => !prev);
        setOpenGroup(null);
      }}
      className="text-lg"
    >
      <FiMenu />
    </button>

   {showDropdown && ( 
    <div className="absolute top-10 right-0 w-72 bg-white text-black rounded shadow-lg z-50 max-h-[80vh] overflow-y-auto border border-gray-300"> 
    {menuGroups.map((group) => group.items.length > 0 ? ( 
      <div key={group.group} className="border-b border-gray-100"> 
      <div className="px-4 py-2 text-sm font-semibold bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between" onClick={() => toggleGroup(group.group)} > 
        <div className="flex items-center gap-2"> {group.icon && <group.icon />} <span>{group.group}</span> </div>
         {openGroup === group.group ? <FiChevronDown /> : <FiChevronRight />} 
         </div> 
         {openGroup === group.group && ( 
          <div className="pl-4"> {group.items.map((item) => ( 
          <div key={item.label} onClick={() => { navigate(item.path); setShowDropdown(false); setOpenGroup(null); }} className="text-sm py-1 px-2 rounded hover:bg-gray-100 cursor-pointer flex items-center gap-2" > 
          <FiChevronRight /> 
          <span>{item.label}</span> 
          </div> 
        ))} 
        </div> 
      )} 
      </div>
     ) : null )}
      <div onClick={handleLogout} className="px-4 py-3 text-red-500 hover:bg-gray-100 cursor-pointer text-sm font-semibold border-t flex items-center gap-2" > 
        <FiLogOut /> 
        <span>Logout</span> 
        </div> 
        </div> 
      )}

  </div>
</div>

    </>
  );
};

export default Navbar;