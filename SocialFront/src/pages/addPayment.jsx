import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import apiClient from '../apiClient';
import BASE_URL from '../config';
import toast from 'react-hot-toast';
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
import { Close, Payment, WhatsApp } from '@mui/icons-material';

export default function AddPayment() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [creditAccount, setCreditAccount] = useState('');
  const [debitAccount, setDebitAccount] = useState('');
  const [allAccounts, setAllAccounts] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState('');
  const [accountGroupUUID, setAccountGroupUUID] = useState('');
  const institute_uuid = localStorage.getItem("institute_uuid");
  const [loading, setLoading] = useState(false);
  const lastSelectedCustomerName = useRef('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppInfo, setWhatsAppInfo] = useState(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.name) setLoggedInUser(user.name);
  }, []);

  useEffect(() => {
    const fetchGroupUUID = async () => {
      try {
        const res = await apiClient.get(`/api/accountgroup/GetAccountgroupList`);
        const group = res.data.result.find(g => g.Account_group === "ACCOUNT");
        if (group) setAccountGroupUUID(group.Account_group_uuid);
      } catch (err) {
        toast.error("Error fetching account groups");
      }
    };
    fetchGroupUUID();
  }, []);

  useEffect(() => {
    if (!accountGroupUUID) return;
    const fetchAccounts = async () => {
      try {
        const res = await apiClient.get(`/api/account/GetAccountList`, { params: { institute_uuid } });
        if (res.data.success) {
          const accounts = res.data.result.filter(
            item => item.Account_group === accountGroupUUID
          );
          setAllAccounts(accounts);
        }
      } catch (err) {
        toast.error("Error fetching accounts");
      }
    };
    fetchAccounts();
  }, [accountGroupUUID, institute_uuid]);

  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        const res = await apiClient.get(`/api/account/GetAccountList`, { params: { institute_uuid } });
        const options = (res.data?.result || []).filter(
          (item) => item.Account_name === 'Bank' || item.Account_name === 'Cash'
        );
        setPaymentModes(options);
      } catch (err) {
        toast.error('Failed to load payment modes');
      }
    };
    fetchPaymentModes();
  }, [institute_uuid]);

  useEffect(() => {
    if (customerSearch) {
      const opts = allAccounts.filter(a =>
        a.Account_name?.toLowerCase().includes(customerSearch.toLowerCase())
      );
      setCustomerOptions(opts);
      setShowCustomerList(true);
    } else {
      setCustomerOptions([]);
      setShowCustomerList(false);
      setCreditAccount('');
      lastSelectedCustomerName.current = '';
    }
  }, [customerSearch, allAccounts]);

  const selectedCustomer = allAccounts.find(a => a.uuid === creditAccount);
  const isValidCustomer = !!selectedCustomer;
  const isValidPaymentMode = !!debitAccount;

  function handleCustomerPick(account) {
    setCustomerSearch(account.Account_name);
    setCreditAccount(account.uuid);
    setShowCustomerList(false);
    lastSelectedCustomerName.current = account.Account_name;
  }

  function handleCustomerInputKeyDown(e) {
    if (e.key === "Enter" && customerOptions.length === 1) {
      e.preventDefault();
      handleCustomerPick(customerOptions[0]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!transactionDate) {
      toast.error("Select date.");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (!isValidCustomer) {
      toast.error("Please select a customer from the list.");
      return;
    }
    if (!isValidPaymentMode) {
      toast.error("Select payment mode.");
      return;
    }
    const customer = selectedCustomer;
    const paymentMode = paymentModes.find(m => m.uuid === debitAccount);
    if (!customer || !paymentMode) {
      toast.error("Invalid customer or payment mode");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const journal = [
      { Account_id: debitAccount, Type: 'Debit', Amount: Number(amount) },
      { Account_id: creditAccount, Type: 'Credit', Amount: Number(amount) }
    ];
    const payload = {
      Description: description,
      Total_Credit: Number(amount),
      Total_Debit: Number(amount),
      Payment_mode: debitAccount,
      Created_by: loggedInUser,
      Transaction_date: transactionDate || today,
      Journal_entry: journal,
      institute_uuid
    };

    setLoading(true);
    try {
      const res = await apiClient.post(`/api/transaction/addTransaction`, payload);
      setLoading(false);
      if (res.data.success) {
        toast.success("Payment added successfully.");
        setWhatsAppInfo({
          name: customer.Account_name,
          phone: customer.Mobile_number,
          amount,
          date: transactionDate || today,
          mode: paymentMode.Account_name
        });
        setShowWhatsAppModal(true);
      } else {
        toast.error("Failed to add Transaction");
      }
    } catch (e) {
      setLoading(false);
      toast.error("Error submitting form.");
    }
  }

  async function handleWhatsAppSend() {
    if (!whatsAppInfo || !whatsAppInfo.phone) {
      toast.error("No customer phone number.");
      return;
    }
    setSendingWhatsApp(true);
    const { name, phone, amount, date, mode } = whatsAppInfo;
    const message = `Hello ${name}, we have received your payment of ₹${amount} on ${date} via ${mode}. Thank you!`;

    try {
      await fetch(`${BASE_URL}/api/institute/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phone, userName: name, type: 'customer', message }),
      });
      setSendingWhatsApp(false);
      setShowWhatsAppModal(false);
      toast.success("Message sent!");
      navigate("/home");
    } catch {
      setSendingWhatsApp(false);
      toast.error("Failed to send WhatsApp message.");
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 3 } }}>
      <Card sx={{ width: '100%', maxWidth: 560, borderRadius: 3, boxShadow: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Add Payment</Typography>
              <Typography variant="body2" color="text.secondary">Record an outgoing payment</Typography>
            </Box>
            <IconButton onClick={() => navigate("/home")} size="small" aria-label="Close">
              <Close />
            </IconButton>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          <form onSubmit={handleSubmit} autoComplete="off">
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
                options={customerOptions}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.Account_name
                }
                inputValue={customerSearch}
                onInputChange={(event, newValue, reason) => {
                  if (reason === 'input') {
                    setCustomerSearch(newValue);
                    if (!newValue) {
                      setCreditAccount('');
                      lastSelectedCustomerName.current = '';
                    }
                  }
                }}
                onChange={(event, newValue) => {
                  if (newValue && typeof newValue === 'object') {
                    handleCustomerPick(newValue);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
                    placeholder="Search customer"
                    size="small"
                    required
                    error={!!customerSearch && !isValidCustomer}
                    helperText={customerSearch && !isValidCustomer ? 'Please select a customer from the list.' : ''}
                    onKeyDown={handleCustomerInputKeyDown}
                  />
                )}
              />

              {/* Amount */}
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/^0+/, ''))}
                inputProps={{ min: 1 }}
                required
                fullWidth
                size="small"
              />

              {/* Payment Mode */}
              <FormControl fullWidth size="small" required>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={debitAccount}
                  onChange={e => setDebitAccount(e.target.value)}
                  label="Payment Mode"
                >
                  <MenuItem value=""><em>Select Payment Mode</em></MenuItem>
                  {paymentModes.map(pm => (
                    <MenuItem key={pm.uuid} value={pm.uuid}>{pm.Account_name}</MenuItem>
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
                disabled={loading || !isValidCustomer || !isValidPaymentMode || !amount}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Payment />}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, py: 1.2, fontWeight: 700 }}
              >
                {loading ? 'Processing...' : 'Save Payment'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* WhatsApp Confirmation Dialog */}
      <Dialog
        open={showWhatsAppModal}
        onClose={() => { setShowWhatsAppModal(false); navigate("/home"); }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WhatsApp sx={{ color: '#25D366' }} />
            <Typography variant="h6" fontWeight={700}>Send WhatsApp Message?</Typography>
          </Stack>
          <IconButton
            onClick={() => { setShowWhatsAppModal(false); navigate("/home"); }}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body1" textAlign="center" mt={1}>
            Do you want to send a WhatsApp payment receipt to{' '}
            <Typography component="span" fontWeight={700}>{whatsAppInfo?.name}</Typography>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            onClick={() => { setShowWhatsAppModal(false); navigate("/home"); }}
            disabled={sendingWhatsApp}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleWhatsAppSend}
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
