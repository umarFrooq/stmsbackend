import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import gradeService from '../../services/gradeService';

const GradeDropdown = ({ branchId, value, onChange, disabled, error, helperText }) => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        if (branchId) {
            setLoading(true);
            gradeService.getGrades({ branchId, limit: 500 })
                .then(data => {
                    setGrades(data.results || []);
                    setFetchError(null);
                })
                .catch(err => {
                    console.error("Failed to fetch grades for branch:", err);
                    setGrades([]);
                    setFetchError("Could not load grades for this branch.");
                })
                .finally(() => setLoading(false));
        } else {
            setGrades([]);
        }
    }, [branchId]);

    return (
        <FormControl fullWidth error={error || !!fetchError} disabled={disabled || loading}>
            <InputLabel id="grade-select-label">Grade (Optional)</InputLabel>
            <Select
                labelId="grade-select-label"
                name="gradeId"
                value={value}
                label="Grade (Optional)"
                onChange={onChange}
            >
                <MenuItem value=""><em>{loading ? 'Loading...' : 'Select Grade'}</em></MenuItem>
                {grades.map(g => (<MenuItem key={g._id} value={g._id}>{g.title}</MenuItem>))}
            </Select>
            {(error || fetchError) && <FormHelperText>{helperText || fetchError}</FormHelperText>}
        </FormControl>
    );
};

export default GradeDropdown;
