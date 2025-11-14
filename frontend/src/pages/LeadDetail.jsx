import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchLeadById, updateLead, createLead } from '../store/slices/leadSlice';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import './LeadDetail.css';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentLead, loading } = useSelector((state) => state.leads);
  const { user } = useSelector((state) => state.auth);
  const [activities, setActivities] = useState([]);
  const [showEditForm, setShowEditForm] = useState(id === 'new');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new',
    value: 0,
    notes: ''
  });
  const [activityData, setActivityData] = useState({
    type: 'note',
    description: ''
  });

  const isNewLead = id === 'new';

  useEffect(() => {
    if (id && !isNewLead) {
      dispatch(fetchLeadById(id));
      fetchActivities();
    }
  }, [id, dispatch, isNewLead]);

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/activities/leads/${id}`);
      setActivities(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch activities');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (isNewLead) {
        const newLead = await dispatch(createLead(formData)).unwrap();
        toast.success('Lead created successfully');
        navigate(`/leads/${newLead.id}`);
      } else {
        await dispatch(updateLead({ id, data: formData })).unwrap();
        toast.success('Lead updated successfully');
        setShowEditForm(false);
        setFormData({});
      }
    } catch (error) {
      toast.error(error);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/activities/leads/${id}`, activityData);
      toast.success('Activity added successfully');
      setShowActivityForm(false);
      setActivityData({ type: 'note', description: '' });
      fetchActivities();
    } catch (error) {
      toast.error('Failed to create activity');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      new: 'badge-primary',
      contacted: 'badge-info',
      qualified: 'badge-success',
      proposal: 'badge-warning',
      negotiation: 'badge-warning',
      won: 'badge-success',
      lost: 'badge-danger'
    };
    return statusClasses[status] || 'badge-primary';
  };

  const getActivityIcon = (type) => {
    const icons = {
      note: '📝',
      call: '📞',
      meeting: '🤝',
      email: '✉️',
      status_change: '🔄',
      assignment: '👤'
    };
    return icons[type] || '📝';
  };

  if (loading && !currentLead && !isNewLead) {
    return <div className="loading">Loading lead...</div>;
  }

  if (!currentLead && !isNewLead) {
    return <div className="error">Lead not found</div>;
  }

  return (
    <div className="lead-detail">
      <div className="page-header">
        <button onClick={() => navigate('/leads')} className="btn btn-secondary">
          ← Back to Leads
        </button>
        <button
          onClick={() => setShowEditForm(!showEditForm)}
          className="btn btn-primary"
        >
          {showEditForm ? 'Cancel' : 'Edit Lead'}
        </button>
      </div>

      {showEditForm ? (
        <div className="card">
          <h2>{isNewLead ? 'Create New Lead' : 'Edit Lead'}</h2>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                required
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="form-group">
              <label>Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {isNewLead ? 'Create Lead' : 'Update Lead'}
            </button>
            {!isNewLead && (
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setFormData({});
                }}
                className="btn btn-secondary"
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="lead-header">
              <div>
                <h1>{currentLead.name}</h1>
                <span className={`badge ${getStatusBadgeClass(currentLead.status)}`}>
                  {currentLead.status}
                </span>
              </div>
              <div className="lead-meta">
                <p>
                  <strong>Owner:</strong> {currentLead.owner?.name || 'Unassigned'}
                </p>
                <p>
                  <strong>Value:</strong> ${currentLead.value?.toLocaleString() || '0'}
                </p>
              </div>
            </div>

            <div className="lead-info-grid">
              <div>
                <h3>Contact Information</h3>
                <p>
                  <strong>Email:</strong> {currentLead.email}
                </p>
                <p>
                  <strong>Phone:</strong> {currentLead.phone || 'N/A'}
                </p>
                <p>
                  <strong>Company:</strong> {currentLead.company || 'N/A'}
                </p>
              </div>
              <div>
                <h3>Additional Information</h3>
                <p>
                  <strong>Source:</strong> {currentLead.source || 'N/A'}
                </p>
                <p>
                  <strong>Created:</strong>{' '}
                  {format(new Date(currentLead.createdAt), 'PPp')}
                </p>
                <p>
                  <strong>Updated:</strong>{' '}
                  {format(new Date(currentLead.updatedAt), 'PPp')}
                </p>
              </div>
            </div>

            {currentLead.notes && (
              <div className="lead-notes">
                <h3>Notes</h3>
                <p>{currentLead.notes}</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <div className="activity-header">
              <h2>Activity Timeline</h2>
              <button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="btn btn-primary"
              >
                + Add Activity
              </button>
            </div>

            {showActivityForm && (
              <form onSubmit={handleCreateActivity} className="activity-form">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={activityData.type}
                    onChange={(e) =>
                      setActivityData({ ...activityData, type: e.target.value })
                    }
                  >
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={activityData.description}
                    onChange={(e) =>
                      setActivityData({
                        ...activityData,
                        description: e.target.value
                      })
                    }
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Activity
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowActivityForm(false);
                    setActivityData({ type: 'note', description: '' });
                  }}
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                >
                  Cancel
                </button>
              </form>
            )}

            <div className="activity-timeline">
              {activities.length === 0 ? (
                <p>No activities yet. Add your first activity!</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-header-item">
                        <strong>{activity.user?.name || 'Unknown'}</strong>
                        <span className="activity-type">{activity.type}</span>
                        <span className="activity-date">
                          {format(new Date(activity.createdAt), 'PPp')}
                        </span>
                      </div>
                      <p>{activity.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadDetail;

