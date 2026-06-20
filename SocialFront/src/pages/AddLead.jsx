import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LeadFormModal from '../components/leads/LeadFormModal';
import { useApp } from '../context/AppContext';

const AddLead = () => {
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();
  const { username } = useParams();
  const { institute_uuid } = useApp();

  const handleClose = () => {
    setShowModal(false);
    navigate(`/${username}/leads`);
  };

  if (!showModal) return null;

  return (
    <LeadFormModal
      onClose={handleClose}
      onSuccess={() => {}}
      institute_uuid={institute_uuid}
    />
  );
};

export default AddLead;
