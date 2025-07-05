import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import schoolService from '../services/schoolService'; // Ensure path is correct
import debounce from 'lodash.debounce';

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
    page: 1, // API is 1-indexed
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  });
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingSchoolAction, setLoadingSchoolAction] = useState(false);
  const [error, setError] = useState(null);

  // --- States for search and filters ---
  const [searchTerm, setSearchTerm] = useState(''); // UI-bound search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Debounced term for API
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const clearSchoolError = useCallback(() => {
    setError(null);
  }, []);

  // Core fetching function
  const fetchSchools = useCallback(async (fetchPagination, search, status, type, city) => {
    setLoadingSchools(true);
    setError(null);

    const queryParams = {
      page: fetchPagination.page,
      limit: fetchPagination.limit,
      sortBy: 'name:asc', // Default sort
    };
    if (search) queryParams.search = search;
    if (status) queryParams.status = status;
    if (type) queryParams.type = type;
    if (city) queryParams.city = city;

    // Remove empty filters to avoid sending empty query params
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
        if (key !== 'search') { // Allow empty search to clear search results
             delete queryParams[key];
        } else if (queryParams.search === '') { // Specifically handle empty search string
            delete queryParams.search;
        }
      }
    });

    try {
      const data = await schoolService.getSchools(queryParams);
      setSchools(data.results || []);
      setPagination({ // Update pagination state based on response
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.totalPages || 1,
        totalResults: data.totalResults || 0,
      });
    } catch (err) {
      console.error('Failed to fetch schools:', err);
      const errMsg = err.message || (err.data && err.data.message) || 'Failed to fetch schools. Please try again.';
      setError(errMsg);
      setSchools([]);
      setPagination(prev => ({ ...prev, totalResults: 0, totalPages:1, page: 1 }));
    } finally {
      setLoadingSchools(false);
    }
  }, []); // schoolService.getSchools is stable

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm) {
        setPagination(prev => ({ ...prev, page: 1 })); // Reset page for new search
        setDebouncedSearchTerm(searchTerm);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  // Main useEffect to fetch data when pagination or any debounced/filter state changes
  useEffect(() => {
    fetchSchools(pagination, debouncedSearchTerm, filterStatus, filterType, filterCity);
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearchTerm,
    filterStatus,
    filterType,
    filterCity,
    fetchSchools
  ]);

  const setSchoolPaginationModel = (model) => {
    setPagination(prev => ({
        ...prev,
        page: model.page + 1,
        limit: model.pageSize,
    }));
  };

  const updateSearchTermAction = (newTerm) => {
    setSearchTerm(newTerm);
  };
  const setSchoolFilterStatusAction = (status) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilterStatus(status);
  };
  const setSchoolFilterTypeAction = (type) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilterType(type);
  };
  const setSchoolFilterCityAction = (city) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilterCity(city);
  };

  const addSchool = async (schoolData) => {
    setLoadingSchoolAction(true);
    setError(null);
    try {
      const newSchoolData = await schoolService.createSchool(schoolData);
      // Fetch schools with current pagination (likely page 1) and filters
      fetchSchools({ ...pagination, page: 1 }, debouncedSearchTerm, filterStatus, filterType, filterCity);
      return { success: true, data: newSchoolData };
    } catch (err) {
      console.error('Failed to add school:', err);
      const errMsg = err.message || (err.data && err.data.message) || 'Failed to add school. Please try again.';
      setError(errMsg);
      throw err;
    } finally {
      setLoadingSchoolAction(false);
    }
  };

  const editSchool = async (schoolId, schoolData) => {
    setLoadingSchoolAction(true);
    setError(null);
    try {
      const updatedSchool = await schoolService.updateSchool(schoolId, schoolData);
      // Optimistically update or refetch. Refetching for simplicity here.
      fetchSchools(pagination, debouncedSearchTerm, filterStatus, filterType, filterCity);
      return { success: true, data: updatedSchool };
    } catch (err) {
      console.error(`Failed to update school ${schoolId}:`, err);
      const errMsg = err.message || (err.data && err.data.message) || 'Failed to update school. Please try again.';
      setError(errMsg);
      throw err;
    } finally {
      setLoadingSchoolAction(false);
    }
  };

  const removeSchool = async (schoolId) => {
    setLoadingSchoolAction(true);
    setError(null);
    try {
      await schoolService.deleteSchool(schoolId);
      // Refetch. Consider if current page is still valid.
      const newTotalResults = Math.max(0, pagination.totalResults - 1);
      const newTotalPages = Math.ceil(newTotalResults / pagination.limit);
      const newPage = Math.min(pagination.page, newTotalPages > 0 ? newTotalPages : 1);

      fetchSchools({ ...pagination, page: newPage, totalResults: newTotalResults, totalPages: newTotalPages }, debouncedSearchTerm, filterStatus, filterType, filterCity);
      return { success: true };
    } catch (err) {
      console.error(`Failed to delete school ${schoolId}:`, err);
      const errMsg = err.message || (err.data && err.data.message) || 'Failed to delete school. Please try again.';
      setError(errMsg);
      throw err;
    } finally {
      setLoadingSchoolAction(false);
    }
  };

  const value = {
    schools,
    pagination,
    setSchoolPaginationModel,
    loadingSchools,
    loadingSchoolAction,
    error,
    fetchSchools, // Exposing the core fetch directly might be useful for explicit refresh
    addSchool,
    editSchool,
    removeSchool,
    clearSchoolError,
    searchTerm,
    updateSearchTerm: updateSearchTermAction,
    filterStatus,
    setSchoolFilterStatus: setSchoolFilterStatusAction,
    filterType,
    setSchoolFilterType: setSchoolFilterTypeAction,
    filterCity,
    setSchoolFilterCity: setSchoolFilterCityAction,
  };

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
};
