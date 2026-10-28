import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewPage from './pages/OverviewPage';
import SalesAnalyticsPage from './pages/SalesAnalyticsPage';
import AnomalyDetectionPage from './pages/AnomalyDetectionPage';
import ForecastingPage from './pages/ForecastingPage';
import RecommendationsPage from './pages/RecommendationsPage';
import DataImportPage from './pages/DataImportPage';
import AboutPage from './pages/AboutPage';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);

  // Global Filter State
  const [filters, setFilters] = useState({
    preset: 'all',
    startDate: null,
    endDate: null,
    region: 'All',
    category: 'All',
  });

  // Intelligence Data State
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [anomalies, setAnomalies] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Health check polling
  const checkHealth = async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch (e) {
      setHealth({ database: { connected: false }, analytics_microservice: { available: false } });
    }
  };

  // Primary data fetcher
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        kpiRes,
        trendRes,
        catRes,
        regRes,
        prodRes,
        anomRes,
        foreRes,
        recRes,
      ] = await Promise.all([
        api.getKpis(filters),
        api.getTrends(filters),
        api.getCategories(filters),
        api.getRegions(filters),
        api.getTopProducts(filters, 10),
        api.getAnomalies(filters).catch((e) => {
          console.warn('Anomaly fetch error:', e.message);
          return null;
        }),
        api.getForecast(filters, 7).catch((e) => {
          console.warn('Forecast fetch error:', e.message);
          return null;
        }),
        api.getRecommendations(filters).catch((e) => {
          console.warn('Recommendations fetch error:', e.message);
          return null;
        }),
      ]);

      if (kpiRes && kpiRes.kpis) setKpis(kpiRes.kpis);
      if (trendRes && trendRes.trends) setTrends(trendRes.trends);
      if (catRes && catRes.categories) setCategories(catRes.categories);
      if (regRes && regRes.regions) setRegions(regRes.regions);
      if (prodRes && prodRes.products) setTopProducts(prodRes.products);
      if (anomRes) setAnomalies(anomRes);
      if (foreRes) setForecast(foreRes);
      if (recRes) setRecommendations(recRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Error communicating with backend service.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    checkHealth();
    loadDashboardData();
  }, [loadDashboardData]);

  // Tab Titles
  const tabTitles = {
    overview: 'Executive Performance Dashboard',
    analytics: 'Sales Analytics & Line-Item Explorer',
    anomalies: 'Statistical Anomaly Detection (IQR & Z-Score)',
    forecast: 'Sales Forecasting & Holdout Evaluation',
    recommendations: 'Prescriptive Decision Intelligence Engine',
    ingestion: 'CSV Data Ingestion & Audit Trail',
    about: 'Architecture, Formulas & Presentation Guide',
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} health={health} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Filter and Navigation Header */}
        <Header
          activeTabTitle={tabTitles[activeTab]}
          filters={filters}
          setFilters={setFilters}
          onRefresh={loadDashboardData}
          loading={loading}
          onOpenUpload={() => setActiveTab('ingestion')}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewPage
              kpis={kpis}
              trends={trends}
              categories={categories}
              regions={regions}
              topProducts={topProducts}
              anomalies={anomalies}
              loading={loading}
              error={error}
              onRetry={loadDashboardData}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && (
            <SalesAnalyticsPage
              filters={filters}
              categories={categories}
              regions={regions}
            />
          )}

          {activeTab === 'anomalies' && (
            <AnomalyDetectionPage
              anomalies={anomalies}
              loading={loading}
              onRetry={loadDashboardData}
            />
          )}

          {activeTab === 'forecast' && (
            <ForecastingPage
              forecastData={forecast}
              loading={loading}
              onRetry={loadDashboardData}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationsPage
              recommendations={recommendations}
              loading={loading}
              onRetry={loadDashboardData}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'ingestion' && (
            <DataImportPage
              onUploadSuccess={loadDashboardData}
            />
          )}

          {activeTab === 'about' && (
            <AboutPage />
          )}
        </main>
      </div>
    </div>
  );
}
