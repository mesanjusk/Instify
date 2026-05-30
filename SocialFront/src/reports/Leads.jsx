import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../apiClient';
import toast, { Toaster } from 'react-hot-toast';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';
import LeadStatusModal from "../components/leads/LeadStatusModal";
import { saveRecords, getAllRecords } from '../db/dbService';

const LEADS_PAGE_SIZE = 24;

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

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [selectedUuids, setSelectedUuids] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const navigate = useNavigate();
  const { username } = useParams();
  const [courses, setCourses] = useState([]);
  const [leadsPage, setLeadsPage] = useState(1);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get(`/api/courses`);
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const institute_uuid = localStorage.getItem('institute_uuid');
      const { data } = await apiClient.get(`/api/leads`, {
        params: { institute_uuid },
      });
      const list = Array.isArray(data?.data) ? data.data : [];
      setLeads(list);
      await saveRecords('leads', list, ['studentData']);
    } catch (error) {
      console.error('❌ Error fetching leads:', error.response?.data || error.message);
      toast.error('Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getAllRecords('leads', ['studentData']);
      if (cached.length) setLeads(cached);
    };
    loadCached();
    fetchLeads();
    fetchCourses();
  }, []);

  const filteredLeads = useMemo(() =>
    leads
      .filter((lead) => {
        if (!Array.isArray(lead.followups) || lead.followups.length === 0) return false;
        const latestFollowup = [...lead.followups].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )[0];
        return latestFollowup?.status === 'follow-up';
      })
      .filter((lead) => {
        const name = `${lead.studentData?.firstName || ''} ${lead.studentData?.lastName || ''}`.toLowerCase();
        const mobile = lead.studentData?.mobileSelf || '';
        return name.includes(search.toLowerCase()) || mobile.includes(search);
      }),
    [leads, search]
  );

  useEffect(() => { setLeadsPage(1); }, [search]);

  const leadsTotalPages = Math.ceil(filteredLeads.length / LEADS_PAGE_SIZE);
  const pagedLeads = filteredLeads.slice((leadsPage - 1) * LEADS_PAGE_SIZE, leadsPage * LEADS_PAGE_SIZE);

  const handleWhatsApp = (mobile, name) => {
    const message = `Hello ${name}, I am contacting you regarding your enquiry.`;
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = (mobile) => {
    window.open(`tel:${mobile}`);
  };

  const getCourseName = (uuid) => {
    const course = courses.find(c => c.Course_uuid === uuid);
    return course?.name || 'Course N/A';
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

  const allSelected = filteredLeads.length > 0 && selectedUuids.size === filteredLeads.length;

  return (
    <div className="p-2">
      <Toaster />
      {selectedLead && (
        <LeadStatusModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          refresh={fetchLeads}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 w-full flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile"
          className="border p-2 rounded flex-1 min-w-[150px]"
        />
        <button
          onClick={() => navigate(`/${username}/add-lead`)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
          aria-label="Add Lead"
        >
          +
        </button>
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

      {loading && <div>Loading leads...</div>}
      {!loading && filteredLeads.length === 0 && <div>No leads found.</div>}

      {!loading && filteredLeads.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {pagedLeads.map((lead) => (
            <div
              key={lead._id || getLeadUuid(lead)}
              className={`relative border rounded-lg p-3 shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between ${selectedUuids.has(getLeadUuid(lead)) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
              onClick={() => selectionMode ? toggleSelect(getLeadUuid(lead)) : setSelectedLead(lead)}
            >
              {selectionMode && (
                <div className="absolute top-2 left-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUuids.has(getLeadUuid(lead))}
                    onChange={() => toggleSelect(getLeadUuid(lead))}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              )}
              <div className={selectionMode ? 'ml-5' : ''}>
                <h2 className="font-semibold text-lg text-gray-800">
                  {lead.studentData?.firstName} {lead.studentData?.lastName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{getCourseName(lead.course)}</p>
              </div>
              {!selectionMode && (
                <div className="flex justify-end items-center gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(lead.studentData?.mobileSelf, lead.studentData?.firstName); }}
                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                    title="WhatsApp"
                  >
                    <FaWhatsapp />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCall(lead.studentData?.mobileSelf); }}
                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                    title="Call"
                  >
                    <FaPhoneAlt />
                  </button>
                </div>
              )}
            </div>
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
              {filteredLeads.map((lead) => (
                <tr
                  key={lead._id || getLeadUuid(lead)}
                  className={`border-b hover:bg-gray-50 cursor-pointer ${selectedUuids.has(getLeadUuid(lead)) ? 'bg-blue-50' : ''}`}
                  onClick={() => selectionMode ? toggleSelect(getLeadUuid(lead)) : setSelectedLead(lead)}
                >
                  {selectionMode && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedUuids.has(getLeadUuid(lead))}
                        onChange={() => toggleSelect(getLeadUuid(lead))}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{lead.studentData?.firstName} {lead.studentData?.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getCourseName(lead.course)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(lead.studentData?.mobileSelf, lead.studentData?.firstName); }}
                        className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600"
                        title="WhatsApp"
                      >
                        <FaWhatsapp size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCall(lead.studentData?.mobileSelf); }}
                        className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                        title="Call"
                      >
                        <FaPhoneAlt size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination (card view only) */}
      {viewMode === 'card' && leadsTotalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {(leadsPage - 1) * LEADS_PAGE_SIZE + 1}–{Math.min(leadsPage * LEADS_PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length} leads
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={leadsPage === 1}
              onClick={() => setLeadsPage(p => p - 1)}
              style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: leadsPage === 1 ? '#f8fafc' : '#fff', cursor: leadsPage === 1 ? 'default' : 'pointer', fontSize: '0.8rem' }}
            >
              ←
            </button>
            <span style={{ fontSize: '0.8rem', padding: '4px 8px', color: '#374151' }}>{leadsPage} / {leadsTotalPages}</span>
            <button
              disabled={leadsPage === leadsTotalPages}
              onClick={() => setLeadsPage(p => p + 1)}
              style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: leadsPage === leadsTotalPages ? '#f8fafc' : '#fff', cursor: leadsPage === leadsTotalPages ? 'default' : 'pointer', fontSize: '0.8rem' }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
