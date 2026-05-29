import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import BASE_URL from '../config';

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

const AllAdmission = () => {
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [selectedUuids, setSelectedUuids] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const navigate = useNavigate();
  const { username } = useParams();
  const institute_uuid = localStorage.getItem('institute_uuid');

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/courses`, { params: { institute_uuid } });
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/admissions`, { params: { institute_uuid } });
      setAdmissions(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error('❌ Error fetching admissions:', error.response?.data || error.message);
      toast.error('Error fetching admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchCourses();
  }, []);

  const filteredAdmissions = admissions.filter((a) => {
    const name = `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.toLowerCase();
    const mobile = a.student?.mobileSelf || '';
    return name.includes(search.toLowerCase()) || mobile.includes(search);
  });

  const handleWhatsApp = (mobile, name) => {
    if (!mobile) return toast.error('Mobile number not available');
    const message = `Hello ${name || ''}, we are contacting you regarding your admission.`;
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = (mobile) => {
    if (!mobile) return toast.error('Mobile number not available');
    window.open(`tel:${mobile}`);
  };

  const getCourseName = (courseUuid) => {
    const course = courses.find((c) => c.uuid === courseUuid || c.Course_uuid === courseUuid);
    return course ? course.name : 'Course N/A';
  };

  const toggleSelect = (uuid) => {
    setSelectedUuids(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const selectAll = () => setSelectedUuids(new Set(filteredAdmissions.map(a => a.uuid)));

  const clearSelection = () => {
    setSelectedUuids(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedUuids.size === 0) return;
    if (!window.confirm(`Delete ${selectedUuids.size} admission(s)?`)) return;
    try {
      await axios.post(`${BASE_URL}/api/admissions/bulk-delete`, { uuids: [...selectedUuids] });
      toast.success(`Deleted ${selectedUuids.size} admission(s)`);
      clearSelection();
      fetchAdmissions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDelete = async (admission) => {
    if (!window.confirm('Delete this admission?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/admissions/${admission.uuid}`);
      toast.success('Admission deleted');
      setSelectedAdmission(null);
      fetchAdmissions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const allSelected = filteredAdmissions.length > 0 && selectedUuids.size === filteredAdmissions.length;

  return (
    <div className="p-4">
      <Toaster />

      {selectedAdmission && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">
              {selectedAdmission.student?.firstName} {selectedAdmission.student?.lastName}
            </h2>
            <p className="text-gray-700 mb-4">Course: {getCourseName(selectedAdmission.course)}</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleDelete(selectedAdmission)}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => navigate(`/${username}/edit-admission/${selectedAdmission._id}`)}
                className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedAdmission(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded text-sm hover:bg-gray-500 ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
          onClick={() => navigate(`/${username}/addadmission`)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
        >
          + New
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

      {loading && <div>Loading admissions...</div>}
      {!loading && filteredAdmissions.length === 0 && <div>No admissions found.</div>}

      {!loading && filteredAdmissions.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {filteredAdmissions.map((admission) => (
            <div
              key={admission._id}
              className={`relative border rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between ${selectedUuids.has(admission.uuid) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
              onClick={() => selectionMode ? toggleSelect(admission.uuid) : setSelectedAdmission(admission)}
            >
              {selectionMode && (
                <div className="absolute top-2 left-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUuids.has(admission.uuid)}
                    onChange={() => toggleSelect(admission.uuid)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              )}
              <div className={selectionMode ? 'ml-5' : ''}>
                <h2 className="font-semibold text-lg text-gray-800">
                  {admission.student?.firstName} {admission.student?.lastName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{getCourseName(admission.course)}</p>
              </div>
              {!selectionMode && (
                <div className="flex justify-end items-center gap-3 mt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(admission.student?.mobileSelf, admission.student?.firstName); }}
                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                    title="WhatsApp"
                  >
                    <FaWhatsapp />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCall(admission.student?.mobileSelf); }}
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

      {!loading && filteredAdmissions.length > 0 && viewMode === 'list' && (
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
              {filteredAdmissions.map((admission) => (
                <tr
                  key={admission._id}
                  className={`border-b hover:bg-gray-50 cursor-pointer ${selectedUuids.has(admission.uuid) ? 'bg-blue-50' : ''}`}
                  onClick={() => selectionMode ? toggleSelect(admission.uuid) : setSelectedAdmission(admission)}
                >
                  {selectionMode && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedUuids.has(admission.uuid)}
                        onChange={() => toggleSelect(admission.uuid)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{admission.student?.firstName} {admission.student?.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getCourseName(admission.course)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleWhatsApp(admission.student?.mobileSelf, admission.student?.firstName); }}
                        className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600"
                        title="WhatsApp"
                      >
                        <FaWhatsapp size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCall(admission.student?.mobileSelf); }}
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
    </div>
  );
};

export default AllAdmission;
