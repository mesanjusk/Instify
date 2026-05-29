import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../../config';
import { useNavigate } from 'react-router-dom';
import LeadEditModal from './LeadEditModal';
import SendWhatsAppMessageModal from '../../modules/whatsapp/components/SendWhatsAppMessageModal';

const LeadStatusModal = ({ lead, onClose, refresh }) => {
  const [status, setStatus] = useState(lead.leadStatus || '');
  const [remark, setRemark] = useState('');
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().substring(0, 10));
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/courses`);
        setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    fetchCourses();
  }, []);

  const updateStatus = async () => {
    if (!status) {
      toast.error('Please select a status');
      return;
    }
    if (status === 'lost' && remark.trim() === '') {
      toast.error('Please provide a remark for lost status');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${BASE_URL}/api/leads/${lead.uuid || lead.Lead_uuid}`, {
        leadStatus: status,
        remark: remark,
        followupDate: status === 'follow-up' ? followUpDate : null,
        createdBy: 'System',
      });
      toast.success('Status updated successfully');
      refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/leads/${lead.uuid || lead.Lead_uuid}`);
      toast.success('Lead deleted');
      refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete lead');
    }
  };

  const handleConvertToAdmission = () => {
    window.open(`/admin/addNewAdd?lead_uuid=${lead.uuid || lead.Lead_uuid}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50 z-[60]">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Update Lead Status</h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Status</option>
            <option value="follow-up">Follow Up</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        {status === 'follow-up' && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Follow-Up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        )}
        {(status === 'follow-up' || status === 'lost') && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">
              {status === 'lost' ? 'Loss Remark' : 'Remark'}
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              required={status === 'lost'}
              className="w-full border p-2 rounded"
              placeholder={status === 'lost' ? 'Reason for loss' : 'Add remark (optional)'}
            />
          </div>
        )}
        {status === 'converted' && (
          <div className="mb-4">
            <button
              onClick={handleConvertToAdmission}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Convert to Admission
            </button>
          </div>
        )}
        <div className="flex justify-end gap-2 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Send WhatsApp Message
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={updateStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
      {showWhatsAppModal && (
        <SendWhatsAppMessageModal
          isOpen={showWhatsAppModal}
          centerId={localStorage.getItem('institute_uuid')}
          contact={lead?.studentData?.mobileSelf || lead?.student?.mobileSelf || ''}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
      {showEditModal && (
        <LeadEditModal
          lead={lead}
          courses={courses}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { refresh(); }}
        />
      )}
    </div>
  );
};

export default LeadStatusModal;
