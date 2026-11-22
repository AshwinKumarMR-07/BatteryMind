import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import BatteryMonitoring from './pages/BatteryMonitoring';
import BatteryDetails from './pages/BatteryDetails';
import AIAnalysis from './pages/AIAnalysis';
import Alerts from './pages/Alerts';
import DataUpload from './pages/DataUpload';
import Settings from './pages/Settings';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBatteryId, setSelectedBatteryId] = useState(1);
  const [alertCount, setAlertCount] = useState(0);

  const refreshAlertCount = async () => {
    try {
      const activeAlerts = await api.getAlerts('All', 'Active');
      setAlertCount(activeAlerts.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshAlertCount();
    const interval = setInterval(refreshAlertCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      {/* Fixed Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={alertCount}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar 
          activeTab={activeTab} 
          selectedBatteryId={selectedBatteryId}
          onSimulateSuccess={refreshAlertCount}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab} 
              setSelectedBatteryId={setSelectedBatteryId} 
            />
          )}

          {activeTab === 'monitoring' && (
            <BatteryMonitoring 
              setActiveTab={setActiveTab} 
              setSelectedBatteryId={setSelectedBatteryId} 
            />
          )}

          {activeTab === 'details' && (
            <BatteryDetails 
              selectedBatteryId={selectedBatteryId} 
              setSelectedBatteryId={setSelectedBatteryId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'ai-analysis' && (
            <AIAnalysis 
              selectedBatteryId={selectedBatteryId} 
              setSelectedBatteryId={setSelectedBatteryId}
            />
          )}

          {activeTab === 'alerts' && (
            <Alerts 
              setActiveTab={setActiveTab} 
              setSelectedBatteryId={setSelectedBatteryId} 
            />
          )}

          {activeTab === 'data-upload' && (
            <DataUpload 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </main>
      </div>
    </div>
  );
}
