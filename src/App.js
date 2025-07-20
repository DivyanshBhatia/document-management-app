import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  Eye,
  LogOut,
  RefreshCw,
  FileText,
  User,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const DocumentManagementApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeView, setActiveView] = useState('list');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    document_type: '',
    document_owner: '',
    document_number: '',
    expiry_date: '',
    action_due_date: ''
  });

  // Environment variables (these would be set in your deployment environment)
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://document-management-api-u9ab.onrender.com';
  const APP_PASSWORD = process.env.REACT_APP_PASSWORD || 'admin123'; // Set this in your environment

  // Authentication
  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (password !== APP_PASSWORD) {
      setError('Invalid password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token?username=testuser&role=admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const data = await response.json();
      setToken(data.access_token);
      setIsAuthenticated(true);
      setError('');
      fetchDocuments();
    } catch (err) {
      setError('Authentication failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // API calls
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data);
      setError('');
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!formData.document_type || !formData.document_owner || !formData.document_number ||
        !formData.expiry_date || !formData.action_due_date) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create document');
      }

      setSuccess('Document created successfully!');
      setFormData({
        document_type: '',
        document_owner: '',
        document_number: '',
        expiry_date: '',
        action_due_date: ''
      });
      setActiveView('list');
      fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async () => {
    if (!formData.document_type || !formData.document_owner || !formData.document_number ||
        !formData.expiry_date || !formData.action_due_date) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${selectedDocument.sno}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update document');
      }

      setSuccess('Document updated successfully!');
      setActiveView('list');
      setSelectedDocument(null);
      fetchDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (sno) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${sno}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setSuccess('Document deleted successfully!');
      fetchDocuments();
    } catch (err) {
      setError('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    return 'normal';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.document_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = filterOwner === '' || doc.document_owner.toLowerCase().includes(filterOwner.toLowerCase());
    return matchesSearch && matchesOwner;
  });

  const handleEdit = (doc) => {
    setSelectedDocument(doc);
    setFormData({
      document_type: doc.document_type,
      document_owner: doc.document_owner,
      document_number: doc.document_number,
      expiry_date: doc.expiry_date,
      action_due_date: doc.action_due_date
    });
    setActiveView('edit');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken('');
    setPassword('');
    setDocuments([]);
    setActiveView('list');
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Document Manager</h1>
            <p className="text-gray-600">Enter password to continue</p>
          </div>

          <div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit(e)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handlePasswordSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-800">Documents</h1>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {activeView === 'list' && (
          <div>
            {/* Search and Filters */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Filter by owner"
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={fetchDocuments}
                  disabled={loading}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Add Document Button */}
            <button
              onClick={() => setActiveView('create')}
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Document
            </button>

            {/* Documents List */}
            {loading && documents.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No documents found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => {
                  const status = getExpiryStatus(doc.expiry_date);
                  const days = getDaysUntilExpiry(doc.expiry_date);

                  return (
                    <div
                      key={doc.sno}
                      className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${
                        status === 'expired' ? 'border-red-500' :
                        status === 'critical' ? 'border-orange-500' :
                        status === 'warning' ? 'border-yellow-500' :
                        'border-green-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{doc.document_type}</h3>
                          <p className="text-sm text-gray-600">#{doc.document_number}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleEdit(doc)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.sno)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>{doc.document_owner}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Expires: {formatDate(doc.expiry_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Action due: {formatDate(doc.action_due_date)}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'expired' ? 'bg-red-100 text-red-800' :
                          status === 'critical' ? 'bg-orange-100 text-orange-800' :
                          status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {status === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {status === 'warning' && <Clock className="w-3 h-3 mr-1" />}
                          {status === 'normal' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {status === 'expired' ? 'Expired' :
                           days === 0 ? 'Expires today' :
                           days === 1 ? 'Expires tomorrow' :
                           `${days} days left`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {(activeView === 'create' || activeView === 'edit') && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {activeView === 'create' ? 'Add Document' : 'Edit Document'}
              </h2>
              <button
                onClick={() => {
                  setActiveView('list');
                  setSelectedDocument(null);
                  setFormData({
                    document_type: '',
                    document_owner: '',
                    document_number: '',
                    expiry_date: '',
                    action_due_date: ''
                  });
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <input
                  type="text"
                  value={formData.document_type}
                  onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Passport, License, Contract"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Owner
                </label>
                <input
                  type="text"
                  value={formData.document_owner}
                  onChange={(e) => setFormData({...formData, document_owner: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Owner name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Number
                </label>
                <input
                  type="text"
                  value={formData.document_number}
                  onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Unique document number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Due Date
                </label>
                <input
                  type="date"
                  value={formData.action_due_date}
                  onChange={(e) => setFormData({...formData, action_due_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button
                onClick={activeView === 'create' ? createDocument : updateDocument}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {activeView === 'create' ? <Plus className="w-5 h-5 mr-2" /> : <Edit className="w-5 h-5 mr-2" />}
                    {activeView === 'create' ? 'Create Document' : 'Update Document'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManagementApp;
