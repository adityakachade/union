import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStats, fetchAnalytics } from '../store/slices/dashboardSlice';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, analytics, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchAnalytics({ period: 30 }));
  }, [dispatch]);

  if (loading && !stats) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const leadsByStatusData = stats?.leadsByStatus
    ? {
        labels: Object.keys(stats.leadsByStatus),
        datasets: [
          {
            label: 'Leads by Status',
            data: Object.values(stats.leadsByStatus),
            backgroundColor: [
              '#3498db',
              '#2ecc71',
              '#f39c12',
              '#e74c3c',
              '#9b59b6',
              '#1abc9c',
              '#34495e'
            ]
          }
        ]
      }
    : null;

  const leadsOverTimeData = analytics?.leadsOverTime
    ? {
        labels: analytics.leadsOverTime.map((item) =>
          new Date(item.date).toLocaleDateString()
        ),
        datasets: [
          {
            label: 'Leads Created',
            data: analytics.leadsOverTime.map((item) => item.count),
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4
          }
        ]
      }
    : null;

  const activitiesByTypeData = analytics?.activitiesByType
    ? {
        labels: Object.keys(analytics.activitiesByType),
        datasets: [
          {
            label: 'Activities',
            data: Object.values(analytics.activitiesByType),
            backgroundColor: [
              '#3498db',
              '#2ecc71',
              '#f39c12',
              '#e74c3c',
              '#9b59b6',
              '#1abc9c'
            ]
          }
        ]
      }
    : null;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Leads</h3>
          <p className="stat-value">{stats?.totalLeads || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Recent Activities</h3>
          <p className="stat-value">{stats?.recentActivities || 0}</p>
          <small>Last 7 days</small>
        </div>
        <div className="stat-card">
          <h3>Total Value</h3>
          <p className="stat-value">
            ${stats?.totalValue?.toLocaleString() || 0}
          </p>
        </div>
        <div className="stat-card">
          <h3>Won Leads</h3>
          <p className="stat-value">
            {stats?.leadsByStatus?.won || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Leads Over Time</h3>
          {leadsOverTimeData ? (
            <Line
              data={leadsOverTimeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          ) : (
            <p>No data available</p>
          )}
        </div>

        <div className="chart-card">
          <h3>Leads by Status</h3>
          {leadsByStatusData ? (
            <Doughnut
              data={leadsByStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
            />
          ) : (
            <p>No data available</p>
          )}
        </div>

        <div className="chart-card">
          <h3>Activities by Type</h3>
          {activitiesByTypeData ? (
            <Bar
              data={activitiesByTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>

      {/* Leads by Owner (for managers/admins) */}
      {stats?.leadsByOwner && stats.leadsByOwner.length > 0 && (
        <div className="card">
          <h3>Leads by Owner</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Lead Count</th>
              </tr>
            </thead>
            <tbody>
              {stats.leadsByOwner.map((item, index) => (
                <tr key={index}>
                  <td>{item.ownerName}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

