import React, { createContext, useState, useContext, useCallback } from 'react';
import schoolService from '../services/schoolService'; // Ensure path is correct

const SchoolContext = createContext();

export const useSchools = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchools must be used within a SchoolProvider');
  }
  return context;
};

export const SchoolProvider = ({ children }) => {
  const [schools, setSchools] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Default limit
    totalPages: 1,
    totalResults: 0,
  });
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingSchoolAction, setLoadingSchoolAction] = useState(false); // For create, update, delete
  const [error, setError] = useState(null);

  const clearSchoolError = useCallback(() => {
    setError(null);
  }, []);

  const fetchSchools = useCallback(async (params = {}) => {
    setLoadingSchools(true);
    setError(null);
    try {
      const queryParams = {
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        sortBy: params.sortBy, // e.g., 'name:asc'
        ...params.filters, // e.g., { name: 'searchText' }
      };
      const data = await schoolService.getSchools(queryParams);
      setSchools(data.results || []);
      setPagination({
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
        totalResults: data.totalResults,
      });
    } catch (err) {
      console.error('Failed to fetch schools:', err);
      setError(err.message || 'Failed to fetch schools. Please try again.');
      setSchools([]); // Clear schools on error
    } finally {
      setLoadingSchools(false);
    }
  }, [pagination.page, pagination.limit]); // Include dependencies if they change fetch behavior

  const addSchool = async (schoolData) => {
    setLoadingSchoolAction(true);
    setError(null);
    try {
      const newSchoolData = await schoolService.createSchool(schoolData);
      // Optionally, re-fetch all schools or optimistically update
      // For simplicity, re-fetching to ensure data consistency
      await fetchSchools(); // This will use current pagination/filters
      return { success: true, data: newSchoolData };
    } catch (err) {
      console.error('Failed to add school:', err);
      setError(err.message || 'Failed to add school. Please try again.');
      throw err; // Re-throw for form error handling
    } finally {
      setLoadingSchoolAction(false);
    }
  };

  const editSchool = async (schoolId, schoolData) => {
    setLoadingSchoolAction(true);
    setError(null);
    try {
      const updatedSchool = await schoolService.updateSchool(schoolId, schoolData);
      // Optimistically update the list or re-fetch
      setSchools(prevSchools =>
        prevSchools.map(school => (school._id === schoolId ? { ...school, ...updatedSchool } : school))
      );
      // Or await fetchSchools(); for full refresh
      return { success: true, data: updatedSchool };
    } catch (err) {
      console.error(`Failed to update school ${schoolId}:`, err);
      setError(err.message || `Failed to update school. Please try again.`);
      throw err; // Re-throw for form error handling
    } finally {
      setLoadingSchoolAction(false);
    }
  };

  const removeSchool = async (schoolId) => {
    setLoadingSchoolAction(true);
    setError(null);
    try {
      await schoolService.deleteSchool(schoolId);
      // Optimistically update or re-fetch
      setSchools(prevSchools => prevSchools.filter(school => school._id !== schoolId));
      // Or await fetchSchools();
      // Update totalResults if using optimistic update
      setPagination(prev => ({ ...prev, totalResults: Math.max(0, prev.totalResults -1) }));
      return { success: true };
    } catch (err) {
      console.error(`Failed to delete school ${schoolId}:`, err);
      setError(err.message || `Failed to delete school. Please try again.`);
      throw err; // Re-throw for UI feedback
    } finally {
      setLoadingSchoolAction(false);
    }
  };

  const value = {
    schools,
    pagination,
    loadingSchools,
    loadingSchoolAction,
    error,
    fetchSchools,
    addSchool,
    editSchool,
    removeSchool,
    clearSchoolError,
  };

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
};
