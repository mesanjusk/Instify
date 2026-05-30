import React, { useEffect, useState } from "react";
import apiClient from '../apiClient';
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from '../utils/dateUtils';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function AddAttendance() {
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceState, setAttendanceState] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const navigate = useNavigate();
    const institute_uuid = localStorage.getItem("institute_uuid");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.name) {
            setLoggedInUser(user.name);
            setUserName(user.name);
        }
    }, []);

    useEffect(() => {
        if (loggedInUser) {
            fetchAttendanceData(loggedInUser);
        }
    }, [loggedInUser]);

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
                setAttendanceState(null);
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

    const saveAttendance = async (type) => {
        if (!userName || !type) return;

        try {
            const formattedTime = new Date().toLocaleTimeString();

            const response = await apiClient.post(`/api/attendance/addAttendance/${institute_uuid}`, {
                User_name: userName,
                Type: type,
                Status: "Present",
                Time: formattedTime
            });

            if (response.data.success) {
                alert(`Attendance saved successfully for ${type}`);

                await initAttendanceState(userName);
                await fetchAttendanceData(userName);
            } else {
                alert("Failed to save attendance.");
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    };

    const fetchUserNames = async () => {
        try {
            const response = await apiClient.get('/api/user/GetUserList');
            const data = response.data;
            if (data.success) {
                const userLookup = {};
                data.result.forEach(user => {
                    userLookup[user.User_uuid] = (user.User_name || '').trim();
                });
                return userLookup;
            } else {
                console.error('Failed to fetch user names:', data);
                return {};
            }
        } catch (error) {
            console.error('Error fetching user names:', error);
            return {};
        }
    };

    const fetchAttendanceData = async (loggedInUser) => {
        try {
            const userLookup = await fetchUserNames();
            const attendanceResponse = await apiClient.get(`/api/attendance/GetAttendanceList`);
            const attendanceRecords = attendanceResponse.data.result || [];

            const formattedData = processAttendanceData(attendanceRecords, userLookup);

            setAttendance(formattedData);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    const processAttendanceData = (data, userLookup) => {
        const groupedData = new Map();
        const todayDate = new Date().toISOString().split("T")[0];

        data.forEach(({ Date: recordDate, User, Employee_uuid }) => {
            if (!User || !Array.isArray(User)) return;
            const employeeUuid = (Employee_uuid || "").trim();
            const userName = userLookup[employeeUuid] || 'Unknown';
            const dateKey = new Date().toISOString().split("T")[0];
            const userDateKey = `${userName}-${dateKey}`;

            if (!groupedData.has(userDateKey)) {
                groupedData.set(userDateKey, {
                    Date: dateKey,
                    User_name: userName,
                    In: "N/A",
                    Break: "N/A",
                    Start: "N/A",
                    Out: "N/A",
                    TotalHours: "N/A"
                });
            }

            const record = groupedData.get(userDateKey);
            User.forEach(userEntry => {
                const time = (userEntry.Time || '').trim();
                switch (userEntry.Type) {
                    case "In": record.In = time; break;
                    case "Break": record.Break = time; break;
                    case "Start": record.Start = time; break;
                    case "Out": record.Out = time; break;
                }
            });
        });

        return Array.from(groupedData.values()).map((record) => {
            record.TotalHours = calculateWorkingHours(record.In, record.Out, record.Break, record.Start);
            return record;
        });
    };

    const calculateWorkingHours = (inTime, outTime, breakTime, startTime) => {
        if (!inTime || !outTime) return "N/A";
        const parseTime = (timeStr) => {
            if (!timeStr || timeStr === "N/A") return null;
            const [time, period] = timeStr.split(" ");
            const [hours, minutes] = time.split(":").map(Number);
            let hours24 = hours;
            if (period === "PM" && hours !== 12) hours24 += 12;
            if (period === "AM" && hours === 12) hours24 = 0;
            const now = new Date();
            now.setHours(hours24, minutes, 0, 0);
            return now;
        };
        const inDate = parseTime(inTime);
        const outDate = parseTime(outTime);
        const breakDate = parseTime(breakTime) || 0;
        const startDate = parseTime(startTime) || 0;
        if (!inDate || !outDate) return "N/A";
        let workDuration = (outDate - inDate) / 1000;
        if (breakDate && startDate) {
            const breakDuration = (startDate - breakDate) / 1000;
            workDuration -= breakDuration;
        }
        const hours = Math.floor(workDuration / 3600);
        const minutes = Math.floor((workDuration % 3600) / 60);
        const seconds = workDuration % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    return (
        <Box sx={{ bgcolor: '#e5ddd5', pt: 2.5, minHeight: '100vh' }}>
            <Box sx={{ maxWidth: '100%', mx: 'auto', px: { xs: 1, md: 2 } }}>
                <Paper elevation={3} sx={{ overflow: 'hidden' }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'stretch', md: 'flex-end' }}
                        justifyContent="space-between"
                        gap={2}
                        sx={{ p: 2 }}
                    >
                        {/* Attendance Table */}
                        <TableContainer
                            sx={{
                                flex: 1,
                                maxHeight: '70vh',
                                overflow: 'auto',
                                width: { xs: '100%', md: '75%' },
                            }}
                        >
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>In</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'grey.100', display: { xs: 'none', md: 'table-cell' } }}>Lunch</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'grey.100', display: { xs: 'none', md: 'table-cell' } }}>Start</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Out</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {attendance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No attendance records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attendance.map((record, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell align="center" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {record.In}
                                                </TableCell>
                                                <TableCell align="center" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>
                                                    {record.Break}
                                                </TableCell>
                                                <TableCell align="center" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>
                                                    {record.Start}
                                                </TableCell>
                                                <TableCell align="center" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {record.Out}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Attendance Action Button */}
                        {showButtons && attendanceState && (
                            <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    startIcon={showButtons ? <AccessTimeIcon /> : <CircularProgress size={18} color="inherit" />}
                                    onClick={async () => {
                                        setShowButtons(false);
                                        await saveAttendance(attendanceState);
                                        setShowButtons(true);
                                    }}
                                    disabled={!showButtons}
                                    sx={{
                                        bgcolor: showButtons ? '#10b981' : 'grey.400',
                                        '&:hover': { bgcolor: showButtons ? '#059669' : 'grey.400' },
                                        py: 1.5,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                    }}
                                >
                                    {showButtons
                                        ? `${userName}   ${attendanceState}   -   ${formatDisplayDate(new Date())}`
                                        : "Saving..."}
                                </Button>
                            </Box>
                        )}
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}
