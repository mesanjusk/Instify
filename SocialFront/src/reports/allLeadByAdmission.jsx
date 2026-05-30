import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import toast, { Toaster } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import AdmissionFormModal from '../components/admissions/AdmissionFormModal';
import ConfirmAdmissionModal from '../components/admissions/ConfirmAdmissionModal';
import ManageBatchModal from '../components/common/ManageBatchModal';
import ManageExamModal from '../components/common/ManageExamModal';
import { formatDisplayDate } from '../utils/dateUtils';
import CertificateModal from '../components/admissions/CertificateModel';
import ReceiptModal from '../components/admissions/ReceiptModal';
import SearchAddAdmissionBar from '../components/reports/SearchAddAdmissionBar';
import LeadCard from '../components/reports/LeadCard';
import LeadDetailsModal from '../components/reports/LeadDetailsModal';
import { saveRecords, getAllRecords } from '../db/dbService';

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
  </svg>
);

const AllLeadByAdmission = () => {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [confirmLead, setConfirmLead] = useState(null);
  const [batchAdmission, setBatchAdmission] = useState(null);
  const [examAdmission, setExamAdmission] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [certificateData, setCertificateData] = useState(null);
  const [institute, setInstitute] = useState({});
  const [viewMode, setViewMode] = useState('card');
  const [selectedUuids, setSelectedUuids] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const navigate = useNavigate();
  const { username } = useParams();
  const institute_uuid = localStorage.getItem('institute_uuid');

  const fetchCourses = async () => {
    try {
      const { data } = await apiClient.get(`/api/courses`, { params: { institute_uuid } });
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/api/Leads`, { params: { institute_uuid } });
      const allLeads = Array.isArray(data?.data) ? data.data : [];
      const leadsWithAdmission = allLeads.filter((lead) => !!lead.admission_uuid);
      setLeads(leadsWithAdmission);
      await saveRecords('leads', leadsWithAdmission, ['student']);
    } catch (error) {
      console.error('❌ Error fetching leads:', error.response?.data || error.message);
      toast.error('Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitute = async () => {
    try {
      const { data } = await apiClient.get(`/api/institute/${institute_uuid}`);
      const inst = data?.result || data;
      setInstitute({
        name: inst.institute_title,
        contact: inst.institute_call_number,
        code: inst.gst,
        logo: (inst.theme && inst.theme.logo) || inst.institute_logo,
      });
    } catch (err) {
      console.error('Error fetching institute:', err);
    }
  };

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getAllRecords('leads', ['student']);
      if (cached.length) setLeads(cached);
    };
    loadCached();
    fetchLeads();
    fetchCourses();
    fetchInstitute();
  }, []);

  const filteredLeads = leads.filter((a) => {
    const student = a.studentData || a.student || {};
    const name = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
    const mobile = student.mobileSelf || '';
    return name.includes(search.toLowerCase()) || mobile.includes(search);
  });

  const handleWhatsApp = (mobile, name) => {
    if (!mobile) return toast.error('Mobile number not available');
    const message = `Hello ${name || ''}, we are contacting you regarding your admission.`;
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getLeadUuid = (lead) => lead.Lead_uuid || lead.uuid;

  const toggleSelect = (uuid) => {
    setSelectedUuids(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const selectAll = () => setSelectedUuids(new Set(filteredLeads.map(getLeadUuid)));

  const clearSelection = () => {
    setSelectedUuids(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedUuids.size === 0) return;
    if (!window.confirm(`Delete ${selectedUuids.size} lead(s)?`)) return;
    try {
      await apiClient.post(`/api/leads/bulk-delete`, { uuids: [...selectedUuids] });
      toast.success(`Deleted ${selectedUuids.size} lead(s)`);
      clearSelection();
      fetchLeads();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteLead = async (lead) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await apiClient.delete(`/api/leads/${getLeadUuid(lead)}`);
      toast.success('Lead deleted');
      setSelectedLead(null);
      fetchLeads();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEditClick = async (lead) => {
    try {
      const { data } = await apiClient.get(`/api/admissions/${lead.admission_uuid}`);
      const admission = data?.data || data;
      const enriched = { ...admission, studentData: lead.studentData || lead.student || {}, course: admission.course || lead.course };
      setEditLead(enriched);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error fetching admission:', error);
      toast.error('Failed to load admission');
    }
  };

  const handleCertificateClick = async (lead) => {
    try {
      const { data } = await apiClient.get(`/api/admissions/${lead.admission_uuid}`);
      const admission = data?.data || data;
      const enriched = { ...admission, studentData: lead.studentData || lead.student || {}, course: admission.course || lead.course };
      setCertificateData(enriched);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error fetching admission:', error);
      toast.error('Failed to load admission');
    }
  };

  const handleManageBatchClick = async (lead) => {
    try {
      const { data } = await apiClient.get(`/api/admissions/${lead.admission_uuid}`);
      const admission = data?.data || data;
      setBatchAdmission(admission);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error fetching admission for batch:', error);
      toast.error('Failed to load admission');
    }
  };

  const handleManageExamClick = async (lead) => {
    try {
      const { data } = await apiClient.get(`/api/admissions/${lead.admission_uuid}`);
      const admission = data?.data || data;
      setExamAdmission(admission);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error fetching admission for exam:', error);
      toast.error('Failed to load admission');
    }
  };

  const handleConfirmClick = async (lead) => {
    try {
      const { data } = await apiClient.get(`/api/admissions/${lead.admission_uuid}`);
      const admission = data?.data || data;
      const enriched = { ...admission, student: lead.student || lead.studentData || {}, course: lead.course };
      setConfirmLead(enriched);
      setSelectedLead(null);
    } catch (error) {
      console.error('Failed to fetch admission:', error);
      toast.error('Unable to fetch admission details');
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.Course_uuid === courseId || c._id === courseId);
    return course ? course.name : 'Course N/A';
  };

  const convertToWords = (num) => {
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    return formatter.format(num).replace('₹', '').trim() + ' Rupees';
  };

  const receiptInfo = selectedLead?.receiptInfo || {};

  const handleReceiptClick = () => {
    if (!receiptInfo || Object.keys(receiptInfo).length === 0) {
      return toast.error('Receipt info not available');
    }
    setReceiptData(receiptInfo);
  };

  const handleSelectLead = async (lead) => {
    try {
      const { data } = await apiClient.get(`/api/admissions/${lead.admission_uuid}`);
      const admission = data?.data || data;

      const { data: feesRes } = await apiClient.get(`/api/fees`, {
        params: { admission_uuid: lead.admission_uuid },
      });

      const feeRecord = Array.isArray(feesRes.data)
        ? feesRes.data.find((f) => f.admission_uuid === lead.admission_uuid)
        : null;

      const receiptInfoData = {
        ...admission,
        learnerName: `${lead.studentData?.firstName || ''} ${lead.studentData?.lastName || ''}`,
        learnerCode: admission?.learnerCode || 'N/A',
        courseName: getCourseName(admission.course || lead.course),
        receiptDate: formatDisplayDate(new Date()),
        receiptNumber: admission?.receiptNumber || `R-${Math.floor(Math.random() * 100000)}`,
        examEvent: admission?.examEvent || 'August',
        amount: feeRecord?.feePaid?.toString() || '0',
        amountWords: convertToWords(feeRecord?.feePaid || 0),
        installmentPlan: feeRecord?.installmentPlan || [],
      };

      setSelectedLead({ ...lead, receiptInfo: receiptInfoData });
    } catch (error) {
      console.error('Failed to fetch admission for lead:', error);
      toast.error('Unable to fetch lead details');
    }
  };

  const allSelected = filteredLeads.length > 0 && selectedUuids.size === filteredLeads.length;

  return (
    <div className="p-4">
      <Toaster />

      <LeadDetailsModal
        lead={selectedLead}
        receiptInfo={receiptInfo}
        institute={institute}
        onEdit={handleEditClick}
        onDelete={handleDeleteLead}
        onManageBatch={handleManageBatchClick}
        onManageExam={handleManageExamClick}
        onConfirm={handleConfirmClick}
        onReceipt={handleReceiptClick}
        onCertificate={handleCertificateClick}
        onClose={() => setSelectedLead(null)}
      />

      <SearchAddAdmissionBar
        search={search}
        setSearch={setSearch}
        onAdd={() => navigate(`/${username}/addNewAdd`)}
      />

      {/* View toggle + selection controls */}
      <div className="flex items-center gap-2 mb-4 w-full flex-wrap">
        <div className="flex border rounded overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode('card')}
            className={`px-2 py-2 ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="Card view"
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title="List view"
          >
            <ListIcon />
          </button>
        </div>
        {!selectionMode ? (
          <button
            onClick={() => setSelectionMode(true)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex-shrink-0 text-sm"
          >
            Select
          </button>
        ) : (
          <>
            <button
              onClick={() => allSelected ? setSelectedUuids(new Set()) : selectAll()}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex-shrink-0 text-sm"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            {selectedUuids.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0 text-sm"
              >
                Delete ({selectedUuids.size})
              </button>
            )}
            <button
              onClick={clearSelection}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 flex-shrink-0 text-sm"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {loading && <div>Loading admissions...</div>}
      {!loading && filteredLeads.length === 0 && <div>No leads with admissions found.</div>}

      {!loading && filteredLeads.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-10 gap-4">
          {filteredLeads.map((admission) => (
            <LeadCard
              key={admission._id}
              lead={admission}
              courseName={getCourseName(admission.course)}
              onSelect={handleSelectLead}
              onWhatsApp={() => handleWhatsApp(admission.student?.mobileSelf, admission.student?.firstName)}
              selectionMode={selectionMode}
              selected={selectedUuids.has(getLeadUuid(admission))}
              onCheckboxChange={() => toggleSelect(getLeadUuid(admission))}
            />
          ))}
        </div>
      )}

      {!loading && filteredLeads.length > 0 && viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-50 border-b">
                {selectionMode && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => allSelected ? setSelectedUuids(new Set()) : selectAll()}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Course</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((admission) => {
                const student = admission.studentData || admission.student || {};
                return (
                  <tr
                    key={admission._id}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${selectedUuids.has(getLeadUuid(admission)) ? 'bg-blue-50' : ''}`}
                    onClick={() => selectionMode ? toggleSelect(getLeadUuid(admission)) : handleSelectLead(admission)}
                  >
                    {selectionMode && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUuids.has(getLeadUuid(admission))}
                          onChange={() => toggleSelect(getLeadUuid(admission))}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium">{student.firstName} {student.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getCourseName(admission.course)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(student.mobileSelf, student.firstName); }}
                        className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600"
                        title="WhatsApp"
                      >
                        <FaWhatsapp size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editLead && (
        <AdmissionFormModal
          editingData={editLead}
          onClose={() => setEditLead(null)}
          onSuccess={() => { setEditLead(null); fetchLeads(); }}
        />
      )}
      {confirmLead && (
        <ConfirmAdmissionModal
          admission={confirmLead}
          onClose={() => setConfirmLead(null)}
          onUpdated={() => { setConfirmLead(null); fetchLeads(); }}
        />
      )}
      {batchAdmission && (
        <ManageBatchModal
          admission={batchAdmission}
          onClose={() => setBatchAdmission(null)}
          onUpdated={() => { setBatchAdmission(null); fetchLeads(); }}
        />
      )}
      {examAdmission && (
        <ManageExamModal
          admission={examAdmission}
          onClose={() => setExamAdmission(null)}
          onUpdated={() => { setExamAdmission(null); fetchLeads(); }}
        />
      )}
      {receiptData && (
        <ReceiptModal
          data={receiptData}
          institute={institute}
          onClose={() => setReceiptData(null)}
        />
      )}
      {certificateData && (
        <CertificateModal
          certificate={certificateData}
          onClose={() => setCertificateData(null)}
          onSuccess={() => { setCertificateData(null); fetchLeads(); }}
        />
      )}
    </div>
  );
};

export default AllLeadByAdmission;
