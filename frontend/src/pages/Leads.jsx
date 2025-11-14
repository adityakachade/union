import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchLeads, deleteLead } from '../store/slices/leadSlice';
import { toast } from 'react-toastify';
import './Leads.css';

const Leads = () => {
  const dispatch = useDispatch();
  const { leads, pagination, loading } = useSelector((state) => state.leads);
  const { user } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1
  });

  useEffect(() => {
    dispatch(fetchLeads(filters));
  }, [dispatch, filters]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await dispatch(deleteLead(id)).unwrap();
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
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

  return (
    <div className="leads-page">
      <div className="page-header">
        <h1>Leads</h1>
        <Link to="/leads/new" className="btn btn-primary">
          + New Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-card card">
        <div className="filters">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{ maxWidth: '300px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="card">
          <p>No leads found. Create your first lead!</p>
        </div>
      ) : (
        <>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Link to={`/leads/${lead.id}`} className="lead-link">
                        {lead.name}
                      </Link>
                    </td>
                    <td>{lead.company || 'N/A'}</td>
                    <td>{lead.email}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>{lead.owner?.name || 'Unassigned'}</td>
                    <td>${lead.value?.toLocaleString() || '0'}</td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          View
                        </Link>
                        {(user?.role === 'admin' ||
                          user?.role === 'manager' ||
                          lead.ownerId === user?.id) && (
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() =>
                  setFilters({ ...filters, page: filters.page - 1 })
                }
                disabled={filters.page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>
                Page {filters.page} of {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setFilters({ ...filters, page: filters.page + 1 })
                }
                disabled={filters.page === pagination.pages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leads;

