import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
import ManageBatchModal from '../components/common/ManageBatchModal';

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

const AllBatches = () => {
  const [admissions, setAdmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [selectedUuids, setSelectedUuids] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const searchTimeout = useRef();

  const institute_uuid = localStorage.getItem('institute_uuid');

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/admissions`, {
        params: { institute_uuid },
      });
      setAdmissions(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching admissions:', error);
      toast.error('Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/courses`, {
        params: { institute_uuid },
      });
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchCourses();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const getCourseName = (uuid) => {
    const course = courses.find(c => c.Course_uuid === uuid || c.uuid === uuid);
    return course?.name || 'Course N/A';
  };

  const filteredAdmissions = useMemo(() => admissions.filter((a) => {
    const name = `${a.studentData?.firstName || a.student?.firstName || ''} ${a.studentData?.lastName || a.student?.lastName || ''}`.toLowerCase();
    const mobile = a.studentData?.mobileSelf || a.student?.mobileSelf || '';
    return name.includes(debouncedSearch.toLowerCase()) || mobile.includes(debouncedSearch);
  }), [admissions, debouncedSearch]);

  const grouped = useMemo(() => filteredAdmissions.reduce((acc, adm) => {
    const batch = adm.batchTime || 'Unassigned';
    if (!acc[batch]) acc[batch] = [];
    acc[batch].push(adm);
    return acc;
  }, {}), [filteredAdmissions]);

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

  const handleDeleteAdmission = async (admission) => {
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

  const getStudentName = (adm) =>
    `${adm.studentData?.firstName || adm.student?.firstName || ''} ${adm.studentData?.lastName || adm.student?.lastName || ''}`.trim();

  return (
    <div className="p-2">
      <Toaster />
      {selectedAdmission && (
        <ManageBatchModal
          admission={selectedAdmission}
          onClose={() => setSelectedAdmission(null)}
          onUpdated={fetchAdmissions}
          onDelete={handleDeleteAdmission}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 w-full flex-wrap">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or mobile"
          className="border p-2 rounded flex-1 min-w-[150px]"
        />
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

      {loading ? (
        <div className="text-center p-6">Loading students...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center p-6 text-gray-500">No students found.</div>
      ) : viewMode === 'card' ? (
        Object.entries(grouped).map(([batch, list]) => (
          <div key={batch} className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{batch}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
              {list.map((admission) => (
                <div
                  key={admission._id}
                  onClick={() => selectionMode ? toggleSelect(admission.uuid) : setSelectedAdmission(admission)}
                  className={`relative border rounded-lg p-3 shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between ${selectedUuids.has(admission.uuid) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
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
                    <h3 className="font-semibold text-lg text-gray-800">{getStudentName(admission)}</h3>
                    <p className="text-sm text-gray-600 mt-1">{getCourseName(admission.course)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Batch</th>
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
                  <td className="px-4 py-3 font-medium">{getStudentName(admission)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getCourseName(admission.course)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{admission.batchTime || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllBatches;
