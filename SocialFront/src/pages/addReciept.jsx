import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from 'react-hot-toast';
import BASE_URL from '../config';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Autocomplete,
} from '@mui/material';
import { Close, Receipt, WhatsApp } from '@mui/icons-material';

export default function AddReceipt() {
    const navigate = useNavigate();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [transactionDate, setTransactionDate] = useState('');
    const [accounts, setAccounts] = useState('');
    const [group, setGroup] = useState('');
    const [student, setStudent] = useState(null);
    const [allAccountOptions, setAllAccountOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [paymentOptions, setPaymentOptions] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [whatsAppInfo, setWhatsAppInfo] = useState(null);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [loading, setLoading] = useState(false);

    const institute_uuid = localStorage.getItem("institute_uuid");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.name) setLoggedInUser(user.name);
    }, []);

    useEffect(() => {
        axios.get(`${BASE_URL}/api/account/GetAccountList`)
            .then(res => {
                if (res.data.success) {
                    setAllAccountOptions(res.data.result);
                    const options = res.data.result.filter(item => item.Account_group === "ACCOUNT");
                    setAccountOptions(options);
                }
            }).catch(err => {
                toast.error("Error fetching accounts");
                console.error(err);
            });
    }, []);

    useEffect(() => {
        const fetchPaymentModes = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/account/GetAccountList`);
                const options = (res.data?.result || []).filter(
                    (item) =>
                        (item.Account_name === 'Bank' || item.Account_name === 'Cash') &&
                        item.institute_uuid === institute_uuid
                );
                setPaymentOptions(options);
            } catch (err) {
                toast.error('Failed to load payment modes');
                console.error('Payment mode fetch error:', err);
            }
        };
        fetchPaymentModes();
    }, [institute_uuid]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setCustomerName(value);

        if (value) {
            const filtered = allAccountOptions.filter(option =>
                option.Account_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredOptions(filtered);
            setShowOptions(true);
        } else {
            setShowOptions(false);
        }
    };

    const handleOptionClick = (option) => {
        setCustomerName(option.Account_name);
        setAccounts(option.uuid);
        setStudent(option);
        setShowOptions(false);
        setFilteredOptions([]);
    };

    const handleAmountChange = (e) => {
        setAmount(e.target.value.replace(/^0+/, ''));
    };

    async function submit(e) {
        e.preventDefault();

        if (!transactionDate) {
            toast.error("Select the date.");
            return;
        }
        if (!customerName || !accounts) {
            toast.error("Please select a customer.");
            return;
        }
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }
        if (!group) {
            toast.error("Select payment mode.");
            return;
        }

        setLoading(true);
        try {
            const Account = allAccountOptions.find(option => option.uuid === accounts);
            const Group = paymentOptions.find(option => option.uuid === group);
            const todayDate = new Date().toISOString().split("T")[0];

            const journal = [
                { Account_id: accounts, Type: 'Debit', Amount: Number(amount) },
                { Account_id: Group.account_uuid || group, Type: 'Credit', Amount: Number(amount) }
            ];

            const payload = {
                Description: description,
                Total_Credit: Number(amount),
                Total_Debit: Number(amount),
                Payment_mode: Group.uuid,
                Created_by: loggedInUser,
                Transaction_date: transactionDate || todayDate,
                Journal_entry: journal,
                institute_uuid,
            };

            const response = await axios.post(`${BASE_URL}/api/transaction/addTransaction`, payload);

            if (response.data.success) {
                toast.success("Receipt added successfully.");
                setWhatsAppInfo({
                    name: Account.Account_name,
                    phone: Account.Mobile_number,
                    amount,
                    date: transactionDate || todayDate,
                    mode: Group.Account_name,
                });
                setShowWhatsAppModal(true);
            } else {
                toast.error("Failed to add transaction");
            }
        } catch (e) {
            console.error("Error adding Transaction:", e);
            toast.error("Error occurred while submitting the form.");
        } finally {
            setLoading(false);
        }
    }

    const sendMessageToAPI = async () => {
        if (!whatsAppInfo || !whatsAppInfo.phone) {
            toast.error("Customer phone number is missing.");
            return;
        }
        setSendingWhatsApp(true);
        const { name, phone, amount, date, mode } = whatsAppInfo;
        const message = `Hello ${name}, we have received your payment of ₹${amount} on ${date} via ${mode}. Thank you!`;

        const payload = {
            mobile: phone,
            userName: name,
            type: 'customer',
            message: message,
        };
        try {
            const res = await fetch(`${BASE_URL}/api/institute/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to send message: ${errorText}`);
            }

            const result = await res.json();
            if (result.error) {
                toast.error("Failed to send: " + result.error);
            } else {
                toast.success("Message sent successfully.");
            }
            setShowWhatsAppModal(false);
            navigate("/dashboard");
        } catch (error) {
            console.error("Request failed:", error);
            toast.error("Failed to send message: " + error.message);
        } finally {
            setSendingWhatsApp(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 3 } }}>
            <Card sx={{ width: '100%', maxWidth: 560, borderRadius: 3, boxShadow: 4 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    {/* Header */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Add Receipt</Typography>
                            <Typography variant="body2" color="text.secondary">Record an incoming payment</Typography>
                        </Box>
                        <IconButton onClick={() => navigate("/home")} size="small" aria-label="Close">
                            <Close />
                        </IconButton>
                    </Stack>
                    <Divider sx={{ mb: 2.5 }} />

                    <form onSubmit={submit}>
                        <Stack spacing={2.5}>
                            {/* Date */}
                            <TextField
                                label="Transaction Date"
                                type="date"
                                value={transactionDate}
                                onChange={e => setTransactionDate(e.target.value)}
                                required
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />

                            {/* Customer Autocomplete */}
                            <Autocomplete
                                freeSolo
                                options={filteredOptions}
                                getOptionLabel={(option) =>
                                    typeof option === 'string' ? option : option.Account_name
                                }
                                inputValue={customerName}
                                onInputChange={(event, newValue, reason) => {
                                    if (reason === 'input') {
                                        handleInputChange({ target: { value: newValue } });
                                    }
                                }}
                                onChange={(event, newValue) => {
                                    if (newValue && typeof newValue === 'object') {
                                        handleOptionClick(newValue);
                                    }
                                }}
                                open={showOptions && filteredOptions.length > 0}
                                onOpen={() => setShowOptions(true)}
                                onClose={() => setShowOptions(false)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Customer"
                                        placeholder="Search customer"
                                        size="small"
                                        required
                                        autoComplete="off"
                                    />
                                )}
                            />

                            {/* Amount */}
                            <TextField
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="Amount"
                                inputProps={{ min: 1 }}
                                required
                                fullWidth
                                size="small"
                            />

                            {/* Payment Mode */}
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Payment Mode</InputLabel>
                                <Select
                                    value={group}
                                    onChange={e => setGroup(e.target.value)}
                                    label="Payment Mode"
                                >
                                    <MenuItem value=""><em>Select Payment Mode</em></MenuItem>
                                    {paymentOptions.map((g) => (
                                        <MenuItem key={g.uuid} value={g.uuid}>
                                            {g.Account_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Description */}
                            <TextField
                                label="Description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Optional description"
                                fullWidth
                                size="small"
                            />

                            {/* Submit */}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Receipt />}
                                sx={{ bgcolor: '#1a7a4a', '&:hover': { bgcolor: '#25a066' }, py: 1.2, fontWeight: 700 }}
                            >
                                {loading ? 'Saving...' : 'Save Receipt'}
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>

            {/* WhatsApp Confirmation Dialog */}
            <Dialog
                open={showWhatsAppModal}
                onClose={() => setShowWhatsAppModal(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <WhatsApp sx={{ color: '#25D366' }} />
                        <Typography variant="h6" fontWeight={700}>Send WhatsApp Message?</Typography>
                    </Stack>
                    <IconButton onClick={() => setShowWhatsAppModal(false)} size="small">
                        <Close />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <Typography variant="body1" textAlign="center" mt={1}>
                        Do you want to send a WhatsApp receipt to{' '}
                        <Typography component="span" fontWeight={700}>{whatsAppInfo?.name}</Typography>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        fullWidth
                        onClick={() => {
                            setShowWhatsAppModal(false);
                            navigate("/dashboard");
                        }}
                        disabled={sendingWhatsApp}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={sendMessageToAPI}
                        disabled={sendingWhatsApp}
                        startIcon={sendingWhatsApp ? <CircularProgress size={16} color="inherit" /> : <WhatsApp />}
                        sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' } }}
                    >
                        {sendingWhatsApp ? 'Sending...' : 'Send'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
