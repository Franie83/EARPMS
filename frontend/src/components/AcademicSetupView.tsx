
import React, { useState, useMemo, useRef } from 'react';
import {
  Building2,
  Users,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Search,
  School as SchoolIcon,
  GraduationCap,
  Clock,
  Check,
  AlertCircle,
  Download,
  Upload,
  ArrowUpRight,
  ArrowRightLeft,
  ShieldAlert,
  FileSpreadsheet,
  Filter,
  UserCheck,
  Phone,
  UserX,
  X,
  Archive,
  FileText,
  HelpCircle,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { store, AppStoreState } from '../lib/store';
import { School, Student, Subject, ClassLevel, AcademicSession, Term, StudentStatus, User } from '../types';

interface AcademicSetupViewProps {
  storeState: AppStoreState;
  onRefresh: () => void;
}

export const AcademicSetupView: React.FC<AcademicSetupViewProps> = ({
  storeState,
  onRefresh
}) => {
  const {
    schools,
    students,
    subjects,
    classes,
    sessions,
    terms,
    currentUser
  } = storeState;

  const [activeTab, setActiveTab] = useState<'schools' | 'classes' | 'students' | 'subjects' | 'calendar'>('students');
  const [notification, setNotification] = useState<string | null>(null);

  // Student Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSchoolFilter, setStudentSchoolFilter] = useState('ALL');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modals for Standard Setup
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);

  // Modals for Student Operations
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [promotingStudent, setPromotingStudent] = useState<Student | null>(null);
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [suspendingStudent, setSuspendingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Bulk Operations Modals
  const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false);
  const [showBulkPromoteModal, setShowBulkPromoteModal] = useState(false);
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [showBulkSuspendModal, setShowBulkSuspendModal] = useState(false);
  const [showBulkArchiveModal, setShowBulkArchiveModal] = useState(false);

  // Operation specific form states
  const [promoteTargetClassId, setPromoteTargetClassId] = useState(classes[0]?.id || '');
  const [promoteNote, setPromoteNote] = useState('');

  const [transferTargetSchoolId, setTransferTargetSchoolId] = useState(schools[0]?.id || '');
  const [transferReason, setTransferReason] = useState('');

  const [suspensionStatusTarget, setSuspensionStatusTarget] = useState<StudentStatus>('suspended');
  const [suspensionReasonText, setSuspensionReasonText] = useState('');

  const [archiveReasonText, setArchiveReasonText] = useState('Administrative cohort archival and graduation records transfer.');

  // Bulk CSV Upload State
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkParsedRows, setBulkParsedRows] = useState<Omit<Student, 'id'>[]>([]);
  const [bulkParseErrors, setBulkParseErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states for class & session
  const [editingClass, setEditingClass] = useState<ClassLevel | null>(null);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [assigningPrincipalSchool, setAssigningPrincipalSchool] = useState<School | null>(null);
  const [selectedPrincipalId, setSelectedPrincipalId] = useState('');
  const [showBulkClassAssignmentModal, setShowBulkClassAssignmentModal] = useState(false);
  const [bulkClassTarget, setBulkClassTarget] = useState<ClassLevel | null>(null);
  const [bulkClassSearch, setBulkClassSearch] = useState('');
  const [bulkClassStudentIds, setBulkClassStudentIds] = useState<string[]>([]);

  // Bulk add existing pupils to the school from the Edit School dialog.
  const [schoolBulkSearch, setSchoolBulkSearch] = useState('');
  const [schoolBulkStudentIds, setSchoolBulkStudentIds] = useState<string[]>([]);
  const [showSchoolBulkPupils, setShowSchoolBulkPupils] = useState(false);


  // Form states
  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    lga: 'Oredo',
    address: '',
    head_teacher: ''
  });

  const [newStudent, setNewStudent] = useState<{
    full_name: string;
    admission_number: string;
    school_id: string;
    class_id: string;
    gender: 'M' | 'F';
    guardian_name: string;
    guardian_phone: string;
    attendance_days: number;
    total_days: number;
    conduct_rating: string;
  }>({
    full_name: '',
    admission_number: '',
    school_id: currentUser.school_id || schools[0]?.id || '',
    class_id: classes[0]?.id || '',
    gender: 'F',
    guardian_name: '',
    guardian_phone: '',
    attendance_days: 62,
    total_days: 65,
    conduct_rating: 'Very Good'
  });

  const [editStudentForm, setEditStudentForm] = useState<{
    full_name: string;
    admission_number: string;
    school_id: string;
    class_id: string;
    gender: 'M' | 'F';
    guardian_name: string;
    guardian_phone: string;
    attendance_days: number;
    total_days: number;
    conduct_rating: string;
    status: StudentStatus;
    suspension_reason: string;
  }>({
    full_name: '',
    admission_number: '',
    school_id: '',
    class_id: '',
    gender: 'F',
    guardian_name: '',
    guardian_phone: '',
    attendance_days: 60,
    total_days: 65,
    conduct_rating: 'Very Good',
    status: 'active',
    suspension_reason: ''
  });

  const [newSubject, setNewSubject] = useState<{
    code: string;
    name: string;
    category: 'Core' | 'Vocational' | 'Language' | 'Science';
  }>({
    code: '',
    name: '',
    category: 'Core'
  });

  const [newClass, setNewClass] = useState<{
    name: string;
    category: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
    arm_count: number;
    capacity: number;
    class_teacher: string;
  }>({
    name: '',
    category: 'Primary',
    arm_count: 2,
    capacity: 40,
    class_teacher: ''
  });

  const [newSession, setNewSession] = useState<{
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  }>({
    name: '2026/2027 Academic Session',
    start_date: '2026-09-14',
    end_date: '2027-07-25',
    is_active: false
  });

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      // Role scope restriction
      if (currentUser.role === 'principal' || currentUser.role === 'teacher') {
        if (currentUser.school_id && st.school_id !== currentUser.school_id) {
          return false;
        }
      }

      // School filter
      if (studentSchoolFilter !== 'ALL' && st.school_id !== studentSchoolFilter) {
        return false;
      }

      // Class filter
      if (studentClassFilter !== 'ALL' && st.class_id !== studentClassFilter) {
        return false;
      }

      // Status filter
      if (studentStatusFilter !== 'ALL') {
        const effectiveStatus = st.status || 'active';
        if (effectiveStatus !== studentStatusFilter) return false;
      }

      // Search term
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchName = st.full_name.toLowerCase().includes(q);
        const matchAdm = st.admission_number.toLowerCase().includes(q);
        const matchGuardian = st.guardian_name?.toLowerCase().includes(q) || false;
        if (!matchName && !matchAdm && !matchGuardian) return false;
      }

      return true;
    });
  }, [students, studentSchoolFilter, studentClassFilter, studentStatusFilter, studentSearch, currentUser]);

  // Select all / deselect all
  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredStudents.some(s => s.id === id)));
    } else {
      const idsToAdd = filteredStudents.map(s => s.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // CSV Enrollment Template Downloader
  const handleDownloadTemplate = () => {
    const headers = [
      'Full Name',
      'Admission Number',
      'School Code',
      'Class Name',
      'Gender',
      'Guardian Name',
      'Guardian Phone',
      'Attendance Days',
      'Total Days',
      'Conduct Rating'
    ];

    const sampleSchool = schools[0]?.code || 'EDS-EM-001';
    const sampleClass = classes[0]?.name || 'Primary 6';

    const sampleRows = [
      ['Osahon Igbinadolor', 'EDS/EM/2026/101', sampleSchool, sampleClass, 'M', 'Mr. Osahon Sr.', '08031122334', '62', '65', 'Very Good'],
      ['Nosa Akhere', 'EDS/EM/2026/102', sampleSchool, sampleClass, 'F', 'Mrs. Blessing Akhere', '08022233445', '64', '65', 'Excellent'],
      ['Eromosele Ikhine', 'EDS/EM/2026/103', sampleSchool, sampleClass, 'M', 'Dr. Peter Ikhine', '08055566778', '60', '65', 'Good']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Edo_State_Ministry_of_Education_Pupil_Enrollment_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Enrollment CSV template downloaded successfully.');
  };

  // Parse CSV helper
  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setBulkParseErrors(['CSV content must contain at least a header row and 1 data row.']);
      setBulkParsedRows([]);
      return;
    }

    const errors: string[] = [];
    const parsed: Omit<Student, 'id'>[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex CSV splitter handling quoted values
      const matches = line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^,]+)/g);
      if (!matches || matches.length < 4) {
        errors.push(`Row ${i + 1}: Insufficient columns. Minimum required: Name, Admission No, School Code/Name, Class.`);
        continue;
      }

      const cleanCells = matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
      const fullName = cleanCells[0] || '';
      const admNo = cleanCells[1] || '';
      const schoolIdentifier = cleanCells[2] || '';
      const classIdentifier = cleanCells[3] || '';
      const gender = (cleanCells[4]?.toUpperCase() === 'M' ? 'M' : 'F') as 'M' | 'F';
      const guardianName = cleanCells[5] || 'Guardian';
      const guardianPhone = cleanCells[6] || '08000000000';
      const attendanceDays = Number(cleanCells[7]) || 60;
      const totalDays = Number(cleanCells[8]) || 65;
      const conductRating = cleanCells[9] || 'Very Good';

      if (!fullName) {
        errors.push(`Row ${i + 1}: Candidate Full Name is missing.`);
        continue;
      }

      // Match school
      const matchedSchool = schools.find(
        s => s.code.toLowerCase() === schoolIdentifier.toLowerCase() || s.name.toLowerCase().includes(schoolIdentifier.toLowerCase())
      ) || schools[0];

      // Match class
      const matchedClass = classes.find(
        c => c.name.toLowerCase() === classIdentifier.toLowerCase() || c.id.toLowerCase() === classIdentifier.toLowerCase()
      ) || classes[0];

      parsed.push({
        full_name: fullName,
        admission_number: admNo || `EDS/BULK/${Date.now().toString().slice(-4)}/${i}`,
        school_id: matchedSchool.id,
        class_id: matchedClass.id,
        gender,
        guardian_name: guardianName,
        guardian_phone: guardianPhone,
        attendance_days: attendanceDays,
        total_days: totalDays,
        conduct_rating: conductRating,
        status: 'active'
      });
    }

    setBulkParseErrors(errors);
    setBulkParsedRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      setBulkCsvText(text);
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleCommitBulkEnrollment = () => {
    if (!bulkParsedRows.length) {
      alert('No valid candidate records parsed to enroll.');
      return;
    }

    const res = store.bulkEnrollStudents(bulkParsedRows);
    notify(res.message);
    setShowBulkEnrollModal(false);
    setBulkCsvText('');
    setBulkParsedRows([]);
    setBulkParseErrors([]);
    onRefresh();
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditStudentForm({
      full_name: student.full_name,
      admission_number: student.admission_number,
      school_id: student.school_id,
      class_id: student.class_id,
      gender: student.gender,
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      attendance_days: student.attendance_days || 60,
      total_days: student.total_days || 65,
      conduct_rating: student.conduct_rating || 'Very Good',
      status: student.status || 'active',
      suspension_reason: student.suspension_reason || ''
    });
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const res = store.updateStudent(editingStudent.id, {
      full_name: editStudentForm.full_name,
      admission_number: editStudentForm.admission_number,
      gender: editStudentForm.gender,
      guardian_name: editStudentForm.guardian_name,
      guardian_phone: editStudentForm.guardian_phone,
      attendance_days: editStudentForm.attendance_days,
      total_days: editStudentForm.total_days,
      conduct_rating: editStudentForm.conduct_rating,
      status: editStudentForm.status,
      suspension_reason: editStudentForm.suspension_reason
    });

    notify(res.message);
    setEditingStudent(null);
    onRefresh();
  };

  // Promote Student Handler
  const handlePromoteStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingStudent) return;

    const res = store.promoteStudent(promotingStudent.id, promoteTargetClassId, promoteNote);
    notify(res.message);
    setPromotingStudent(null);
    setPromoteNote('');
    onRefresh();
  };

  // Transfer Student Handler
  const handleTransferStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent) return;

    const res = store.transferStudent(transferringStudent.id, transferTargetSchoolId, transferReason);
    notify(res.message);
    setTransferringStudent(null);
    setTransferReason('');
    onRefresh();
  };

  // Suspend / Change Status Handler
  const handleSetStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingStudent) return;

    const res = store.setStudentStatus(suspendingStudent.id, suspensionStatusTarget, suspensionReasonText);
    notify(res.message);
    setSuspendingStudent(null);
    setSuspensionReasonText('');
    onRefresh();
  };

  // Delete Individual Student Handler
  const handleDeleteStudentSubmit = () => {
    if (!deletingStudent) return;
    const res = store.deleteStudent(deletingStudent.id);
    notify(res.message);
    setDeletingStudent(null);
    setSelectedStudentIds(prev => prev.filter(id => id !== deletingStudent.id));
    onRefresh();
  };

  // Bulk Operations Handlers
  const handleBulkPromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.bulkPromoteStudents(selectedStudentIds, promoteTargetClassId, promoteNote);
    notify(res.message);
    setShowBulkPromoteModal(false);
    setSelectedStudentIds([]);
    onRefresh();
  };

  const handleBulkTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.bulkTransferStudents(selectedStudentIds, transferTargetSchoolId, transferReason);
    notify(res.message);
    setShowBulkTransferModal(false);
    setSelectedStudentIds([]);
    onRefresh();
  };

  const handleBulkArchiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.bulkArchiveStudents(selectedStudentIds, archiveReasonText);
    notify(res.message);
    setShowBulkArchiveModal(false);
    setSelectedStudentIds([]);
    onRefresh();
  };

  const handleBulkSuspendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.bulkAssignStudents(selectedStudentIds, {
      status: suspensionStatusTarget,
      suspension_reason: suspensionReasonText
    });
    notify(res.message);
    setShowBulkSuspendModal(false);
    setSelectedStudentIds([]);
    onRefresh();
  };

  const handleBulkDeleteSubmit = () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedStudentIds.length} selected candidate records?`)) {
      return;
    }
    const res = store.deleteMultipleStudents(selectedStudentIds);
    notify(res.message);
    setSelectedStudentIds([]);
    onRefresh();
  };

  // Handle Add Single Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const student: Student = {
      id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      full_name: newStudent.full_name.trim(),
      admission_number: newStudent.admission_number.toUpperCase().trim(),
      school_id: newStudent.school_id,
      class_id: newStudent.class_id,
      gender: newStudent.gender,
      guardian_name: newStudent.guardian_name || 'Parent / Guardian',
      guardian_phone: newStudent.guardian_phone || '08000000000',
      attendance_days: Number(newStudent.attendance_days || 60),
      total_days: Number(newStudent.total_days || 65),
      conduct_rating: newStudent.conduct_rating || 'Very Good',
      status: 'active'
    };

    store.getState().students.push(student);
    store.recordAudit('CREATE', 'student', student.id, undefined, student);
    store.save();
    setShowAddStudentModal(false);
    setNewStudent({
      full_name: '',
      admission_number: '',
      school_id: currentUser.school_id || schools[0]?.id || '',
      class_id: classes[0]?.id || '',
      gender: 'F',
      guardian_name: '',
      guardian_phone: '',
      attendance_days: 62,
      total_days: 65,
      conduct_rating: 'Very Good'
    });
    notify(`Candidate "${student.full_name}" enrolled successfully.`);
    onRefresh();
  };

  // Handle Add School
  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'super-admin') {
      notify('Only Super-Admin can register or modify schools.');
      return;
    }
    const normalizedCode = newSchool.code.trim().toUpperCase();
    if (store.getState().schools.some(s => s.code.toUpperCase() === normalizedCode)) {
      notify(`School code "${normalizedCode}" is already in use.`);
      return;
    }
    const school: School = {
      id: `sch-${Date.now()}`,
      name: newSchool.name.trim(),
      code: normalizedCode,
      lga: newSchool.lga,
      address: newSchool.address.trim() || `${newSchool.lga}, Edo State`,
      head_teacher: newSchool.head_teacher.trim() || 'Not Assigned',
      principal_user_id: null
    };
    store.getState().schools.push(school);
    store.recordAudit('CREATE', 'school', school.id, undefined, school);
    store.save();
    setShowAddSchoolModal(false);
    setNewSchool({ name: '', code: '', lga: 'Oredo', address: '', head_teacher: '' });
    notify(`School "${school.name}" registered successfully.`);
    onRefresh();
  };

  const handleEditSchool = (school: School) => {
    if (currentUser.role !== 'super-admin') {
      notify('Only Super-Admin can edit schools.');
      return;
    }
    setEditingSchool({ ...school });
    setShowSchoolBulkPupils(false);
    setSchoolBulkSearch('');
    setSchoolBulkStudentIds([]);
  };

  const handleSaveSchoolEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || currentUser.role !== 'super-admin') return;

    const state = store.getState();
    const normalizedCode = editingSchool.code.trim().toUpperCase();
    if (!editingSchool.name.trim() || !normalizedCode) {
      notify('School name and school code are required.');
      return;
    }
    if (state.schools.some(s => s.id !== editingSchool.id && s.code.toUpperCase() === normalizedCode)) {
      notify(`School code "${normalizedCode}" is already in use.`);
      return;
    }

    const idx = state.schools.findIndex(s => s.id === editingSchool.id);
    if (idx === -1) return;
    const oldSchool = { ...state.schools[idx] };
    const updated: School = {
      ...state.schools[idx],
      ...editingSchool,
      name: editingSchool.name.trim(),
      code: normalizedCode,
      lga: editingSchool.lga.trim(),
      address: editingSchool.address.trim() || `${editingSchool.lga}, Edo State`
    };
    state.schools[idx] = updated;
    store.recordAudit('UPDATE', 'school', updated.id, oldSchool, updated);
    store.save();
    setEditingSchool(null);
    notify(`School "${updated.name}" updated successfully.`);
    onRefresh();
  };

  const schoolBulkCandidates = useMemo(() => {
    if (!editingSchool) return [];
    const q = schoolBulkSearch.trim().toLowerCase();

    return students.filter((st) => {
      if ((st.status || 'active') === 'archived' || (st.status || 'active') === 'graduated') {
        return false;
      }
      if (!q) return true;

      const school = schools.find((sc) => sc.id === st.school_id);
      const cls = classes.find((c) => c.id === st.class_id);

      return (
        st.full_name.toLowerCase().includes(q) ||
        st.admission_number.toLowerCase().includes(q) ||
        (school?.name || '').toLowerCase().includes(q) ||
        (cls?.name || '').toLowerCase().includes(q)
      );
    });
  }, [students, schools, classes, editingSchool, schoolBulkSearch]);

  const handleSchoolBulkToggle = (studentId: string) => {
    setSchoolBulkStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSchoolBulkSelectVisible = () => {
    const visibleIds = schoolBulkCandidates.map(st => st.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => schoolBulkStudentIds.includes(id));

    if (allSelected) {
      setSchoolBulkStudentIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSchoolBulkStudentIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleAddPupilsToSchool = () => {
    if (!editingSchool || !schoolBulkStudentIds.length || currentUser.role !== 'super-admin') return;

    const state = store.getState();
    const targetSchool = state.schools.find(sc => sc.id === editingSchool.id);
    if (!targetSchool) {
      notify('School not found.');
      return;
    }

    const ids = Array.from(new Set(schoolBulkStudentIds));
    const affected: Array<{ id: string; oldSchoolId: string; newSchoolId: string }> = [];

    ids.forEach(id => {
      const pupil = state.students.find(st => st.id === id);
      if (!pupil || pupil.school_id === targetSchool.id) return;

      affected.push({
        id: pupil.id,
        oldSchoolId: pupil.school_id,
        newSchoolId: targetSchool.id
      });

      pupil.school_id = targetSchool.id;

      // A school transfer is an administrative reassignment. Preserve class,
      // admission number, attendance and other pupil data.
      pupil.transfer_history = [
        ...(pupil.transfer_history || []),
        {
          date: new Date().toISOString(),
          from_school_id: affected[affected.length - 1].oldSchoolId,
          to_school_id: targetSchool.id,
          reason: 'Bulk school enrollment from Edit School',
          authorized_by: currentUser.username
        }
      ];
      pupil.status = 'active';
    });

    if (!affected.length) {
      notify('No new pupils were added. Selected pupils may already belong to this school.');
      return;
    }

    store.recordAudit(
      'UPDATE',
      'school-bulk-pupil-enrollment',
      targetSchool.id,
      undefined,
      {
        school_id: targetSchool.id,
        school_name: targetSchool.name,
        student_ids: affected.map(x => x.id),
        count: affected.length,
        operation: 'bulk-add-existing-pupils-to-school'
      }
    );

    // recordAudit persists the state. Clear selection and refresh from the
    // authoritative store without replacing or resetting any records.
    setSchoolBulkStudentIds([]);
    setSchoolBulkSearch('');
    notify(`${affected.length} pupil${affected.length === 1 ? '' : 's'} added to ${targetSchool.name}.`);
    onRefresh();
  };

  const handleOpenPrincipalAssignment = (school: School) => {
    if (currentUser.role !== 'super-admin') {
      notify('Only Super-Admin can assign principals.');
      return;
    }
    setAssigningPrincipalSchool(school);
    setSelectedPrincipalId(school.principal_user_id || '');
  };

  const handleAssignPrincipal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningPrincipalSchool || currentUser.role !== 'super-admin') return;

    const state = store.getState();
    const schoolIdx = state.schools.findIndex(s => s.id === assigningPrincipalSchool.id);
    if (schoolIdx === -1) return;

    const principal = state.users.find(
      u => u.id === selectedPrincipalId && u.role === 'principal' && u.is_active
    );
    if (!principal) {
      notify('Select an active Principal account.');
      return;
    }

    const existingAssignment = state.schools.find(
      s => s.id !== assigningPrincipalSchool.id && s.principal_user_id === principal.id
    );
    if (existingAssignment) {
      notify(`${principal.full_name} is already assigned to ${existingAssignment.name}. Reassign them there first.`);
      return;
    }

    const oldSchool = { ...state.schools[schoolIdx] };
    const previousPrincipalId = oldSchool.principal_user_id;
    const previousPrincipal = previousPrincipalId
      ? state.users.find(u => u.id === previousPrincipalId)
      : undefined;

    state.schools[schoolIdx] = {
      ...oldSchool,
      principal_user_id: principal.id,
      head_teacher: principal.full_name.replace(/\s*\([^)]*\)\s*$/, '').trim()
    };

    // Keep the principal's account and school relationship synchronized.
    state.users.forEach(user => {
      if (user.role === 'principal' && user.school_id === assigningPrincipalSchool.id && user.id !== principal.id) {
        user.school_id = null;
      }
    });
    principal.school_id = assigningPrincipalSchool.id;

    store.recordAudit(
      'ROLE_CHANGE',
      'school-principal',
      assigningPrincipalSchool.id,
      {
        school_id: assigningPrincipalSchool.id,
        previous_principal_id: previousPrincipalId || null,
        previous_principal_name: previousPrincipal?.full_name || null
      },
      {
        school_id: assigningPrincipalSchool.id,
        principal_user_id: principal.id,
        principal_name: principal.full_name
      }
    );

    store.save();
    setAssigningPrincipalSchool(null);
    setSelectedPrincipalId('');
    notify(`${principal.full_name} assigned to ${assigningPrincipalSchool.name}.`);
    onRefresh();
  };

  // Handle Add Subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const subject: Subject = {
      id: `sub-${Date.now()}`,
      code: newSubject.code.toUpperCase(),
      name: newSubject.name,
      category: newSubject.category
    };
    store.getState().subjects.push(subject);
    store.recordAudit('CREATE', 'subject', subject.id, undefined, subject);
    store.save();
    setShowAddSubjectModal(false);
    setNewSubject({ code: '', name: '', category: 'Core' });
    notify(`Subject "${subject.name}" added to curriculum.`);
    onRefresh();
  };

  // Handle Add / Edit Class Level
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      const idx = store.getState().classes.findIndex(c => c.id === editingClass.id);
      if (idx !== -1) {
        store.getState().classes[idx] = {
          ...editingClass,
          name: newClass.name,
          category: newClass.category,
          arm_count: newClass.arm_count,
          capacity: newClass.capacity,
          class_teacher: newClass.class_teacher
        };
        store.recordAudit('UPDATE', 'class-level', editingClass.id, undefined, store.getState().classes[idx]);
        notify(`Class Level "${newClass.name}" updated successfully.`);
      }
      setEditingClass(null);
    } else {
      const idPrefix = newClass.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cls: ClassLevel = {
        id: `cls-${idPrefix}-${Date.now().toString().slice(-4)}`,
        name: newClass.name.trim(),
        category: newClass.category,
        arm_count: newClass.arm_count,
        capacity: newClass.capacity,
        class_teacher: newClass.class_teacher || 'Assigned Form Teacher'
      };
      store.getState().classes.push(cls);
      store.recordAudit('CREATE', 'class-level', cls.id, undefined, cls);
      notify(`Class Level "${cls.name}" created successfully.`);
    }
    store.save();
    setShowAddClassModal(false);
    setNewClass({ name: '', category: 'Primary', arm_count: 2, capacity: 40, class_teacher: '' });
    onRefresh();
  };

  const openBulkClassAssignment = (cls: ClassLevel) => {
    setBulkClassTarget(cls);
    setBulkClassSearch('');
    setBulkClassStudentIds([]);
    setShowBulkClassAssignmentModal(true);
  };

  const bulkClassCandidates = useMemo(() => {
    if (!bulkClassTarget) return [];
    const q = bulkClassSearch.trim().toLowerCase();
    return students.filter(st => {
      if ((st.status || 'active') === 'archived' || (st.status || 'active') === 'graduated') return false;
      if (st.class_id === bulkClassTarget.id) return false;
      if (!q) return true;
      return st.full_name.toLowerCase().includes(q) || st.admission_number.toLowerCase().includes(q);
    });
  }, [students, bulkClassTarget, bulkClassSearch]);

  const handleBulkClassAssignment = () => {
    if (!bulkClassTarget || !bulkClassStudentIds.length) return;
    const res = store.bulkAssignStudentsToClass(bulkClassTarget.id, bulkClassStudentIds);
    notify(res.message);
    if (res.success) {
      setShowBulkClassAssignmentModal(false);
      setBulkClassTarget(null);
      setBulkClassStudentIds([]);
      onRefresh();
    }
  };

  const handleDeleteClass = (id: string) => {
    if (!confirm('Are you sure you want to delete this class level?')) return;
    store.getState().classes = store.getState().classes.filter(c => c.id !== id);
    store.recordAudit('DELETE', 'class-level', id);
    store.save();
    notify('Class Level removed.');
    onRefresh();
  };

  // Handle Add / Edit Session
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      const idx = store.getState().sessions.findIndex(s => s.id === editingSession.id);
      if (idx !== -1) {
        if (newSession.is_active) {
          store.getState().sessions.forEach(s => (s.is_active = false));
        }
        store.getState().sessions[idx] = {
          ...editingSession,
          name: newSession.name,
          start_date: newSession.start_date,
          end_date: newSession.end_date,
          is_active: newSession.is_active
        };
        store.recordAudit('UPDATE', 'academic-session', editingSession.id, undefined, store.getState().sessions[idx]);
        notify(`Session "${newSession.name}" updated successfully.`);
      }
      setEditingSession(null);
    } else {
      if (newSession.is_active) {
        store.getState().sessions.forEach(s => (s.is_active = false));
      }
      const sess: AcademicSession = {
        id: `sess-${Date.now().toString().slice(-6)}`,
        name: newSession.name.trim(),
        start_date: newSession.start_date,
        end_date: newSession.end_date,
        is_active: newSession.is_active
      };
      store.getState().sessions.push(sess);

      // Also create 3 standard terms for this session
      const termNames: ('1st Term' | '2nd Term' | '3rd Term')[] = ['1st Term', '2nd Term', '3rd Term'];
      termNames.forEach((tName, i) => {
        store.getState().terms.push({
          id: `term-${sess.id}-${i + 1}`,
          session_id: sess.id,
          name: tName,
          is_active: sess.is_active && i === 1 // default to 2nd term active
        });
      });

      store.recordAudit('CREATE', 'academic-session', sess.id, undefined, sess);
      notify(`Session "${sess.name}" and 3 grading terms generated.`);
    }
    store.save();
    setShowAddSessionModal(false);
    onRefresh();
  };

  const handleSetActiveSession = (sessionId: string) => {
    store.getState().sessions.forEach(s => {
      s.is_active = s.id === sessionId;
    });
    store.save();
    notify('Active academic session updated.');
    onRefresh();
  };

  const handleSetActiveTerm = (termId: string) => {
    store.getState().terms.forEach(t => {
      t.is_active = t.id === termId;
    });
    store.save();
    notify('Current active grading term updated.');
    onRefresh();
  };

  const handleDeleteSession = (id: string) => {
    if (!confirm('Are you sure? Deleting session removes associated term structures.')) return;
    store.getState().sessions = store.getState().sessions.filter(s => s.id !== id);
    store.getState().terms = store.getState().terms.filter(t => t.session_id !== id);
    store.recordAudit('DELETE', 'academic-session', id);
    store.save();
    notify('Session deleted.');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-orange-300 px-4 py-3 rounded-2xl shadow-2xl border border-orange-500/40 flex items-center gap-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Academic Hierarchy & Master Setup
            </h2>
            <p className="text-xs text-slate-500">
              Manage participating Edo State schools, pupil registry, classes, promotions, transfers, and sessions.
            </p>
          </div>
        </div>

        {/* Global Action Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors border border-slate-300 cursor-pointer shadow-xs"
            title="Download CSV template for bulk student registration"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" />
            <span>Download CSV Template</span>
          </button>

          <button
            onClick={() => setShowBulkEnrollModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-orange-300 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer border border-orange-500/30"
          >
            <Upload className="w-3.5 h-3.5 text-orange-400" />
            <span>Bulk Pupil Enrollment</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher Strip */}
      <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-2xl border border-slate-300 text-xs font-bold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-orange-500 text-slate-950 shadow-md border border-orange-400'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pupils & Enrolled Candidates ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-orange-500 text-slate-950 shadow-md border border-orange-400'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Class Levels & Arms ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'schools'
              ? 'bg-orange-500 text-slate-950 shadow-md border border-orange-400'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Participating Schools ({schools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-orange-500 text-slate-950 shadow-md border border-orange-400'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Academic Sessions & Terms</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-orange-500 text-slate-950 shadow-md border border-orange-400'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Subjects ({subjects.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PUPILS / STUDENTS TAB (RICH LIFECYCLE MANAGEMENT)                          */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Top Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Filter className="w-4 h-4 text-orange-500" />
                <span>Filter Pupil Registry ({filteredStudents.length} of {students.length} Pupils)</span>
              </div>

              <div className="flex items-center gap-2">
                {(studentSearch || studentSchoolFilter !== 'ALL' || studentClassFilter !== 'ALL' || studentStatusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setStudentSearch('');
                      setStudentSchoolFilter('ALL');
                      setStudentClassFilter('ALL');
                      setStudentStatusFilter('ALL');
                    }}
                    className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer text-xs"
                  >
                    Reset Filters
                  </button>
                )}

                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs border border-orange-400"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enroll Individual Pupil</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Text Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by candidate name, admission no or guardian..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* School Filter */}
              <div>
                <select
                  value={studentSchoolFilter}
                  onChange={e => setStudentSchoolFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="ALL">All Participating Schools ({schools.length})</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.lga})</option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <select
                  value={studentClassFilter}
                  onChange={e => setStudentClassFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="ALL">All Class Levels ({classes.length})</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={studentStatusFilter}
                  onChange={e => setStudentStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer font-medium"
                >
                  <option value="ALL">All Candidate Statuses</option>
                  <option value="active">Active Enrolled</option>
                  <option value="suspended">Suspended</option>
                  <option value="transferred">Transferred</option>
                  <option value="archived">Archived</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Floating Bulk Action Toolbar (Docked at bottom of viewport for high usability) */}
          {selectedStudentIds.length > 0 && (
            <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between sm:justify-start gap-3 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2.5 sm:pr-4 sm:border-r border-slate-700">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  {selectedStudentIds.length}
                </span>
                <strong className="text-xs font-bold text-slate-200 whitespace-nowrap">
                  {selectedStudentIds.length === 1 ? '1 Pupil Selected' : `${selectedStudentIds.length} Pupils Selected`}
                </strong>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  onClick={() => {
                    setPromoteTargetClassId(classes[0]?.id || '');
                    setPromoteNote(`Mass promotion for ${selectedStudentIds.length} pupils`);
                    setShowBulkPromoteModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Promote</span>
                </button>

                <button
                  onClick={() => {
                    setTransferTargetSchoolId(schools[0]?.id || '');
                    setTransferReason(`Mass transfer for ${selectedStudentIds.length} pupils`);
                    setShowBulkTransferModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>

                <button
                  onClick={() => setShowBulkArchiveModal(true)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>

                <button
                  onClick={() => setShowBulkSuspendModal(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Status</span>
                </button>

                <button
                  onClick={handleBulkDeleteSubmit}
                  className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedStudentIds([])}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer ml-auto sm:ml-2"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pupils Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                        title="Select All Filtered Pupils"
                      />
                    </th>
                    <th className="py-3 px-4">Pupil / Candidate Name</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">School & LGA</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Guardian Contact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No candidate records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(st => {
                      const sch = schools.find(s => s.id === st.school_id);
                      const cls = classes.find(c => c.id === st.class_id);
                      const isSelected = selectedStudentIds.includes(st.id);
                      const status = st.status || 'active';

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-orange-50/40 transition-colors ${
                            isSelected ? 'bg-orange-50/70' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(st.id)}
                              className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block text-xs">{st.full_name}</strong>
                            {st.promotion_history && st.promotion_history.length > 0 && (
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                                <ArrowUpRight className="w-2.5 h-2.5" />
                                {st.promotion_history[st.promotion_history.length - 1].note}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">
                            {st.admission_number}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-900 font-semibold block">{sch ? sch.name : 'Unassigned'}</span>
                            <span className="text-[10px] text-slate-500">{sch?.lga} LGA</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold text-slate-800">
                              {cls ? cls.name : 'Unassigned'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              st.gender === 'F' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {st.gender === 'F' ? 'Female' : 'Male'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                              status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              status === 'suspended' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              status === 'transferred' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            }`}>
                              {status === 'active' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3" />}
                              {status}
                            </span>
                            {status === 'suspended' && st.suspension_reason && (
                              <p className="text-[10px] text-rose-600 mt-0.5 max-w-[120px] truncate" title={st.suspension_reason}>
                                {st.suspension_reason}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            {st.attendance_days || 60}/{st.total_days || 65} Days
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px]">
                            <span className="block font-semibold text-slate-800 truncate max-w-[130px]">{st.guardian_name || 'Guardian'}</span>
                            <span className="font-mono text-slate-500 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              {st.guardian_phone || '08000000000'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Profile */}
                              <button
                                onClick={() => handleOpenEditStudent(st)}
                                className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Pupil Profile"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Promote Class */}
                              <button
                                onClick={() => {
                                  setPromotingStudent(st);
                                  setPromoteTargetClassId(classes[0]?.id || '');
                                  setPromoteNote(`Promoted from ${cls?.name || 'current class'}`);
                                }}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Promote to Higher Class Level"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Transfer School */}
                              <button
                                onClick={() => {
                                  setTransferringStudent(st);
                                  setTransferTargetSchoolId(schools[0]?.id || '');
                                  setTransferReason(`School transfer authorized`);
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Transfer to Another School"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend / Change Status */}
                              <button
                                onClick={() => {
                                  setSuspendingStudent(st);
                                  setSuspensionStatusTarget(st.status === 'suspended' ? 'active' : 'suspended');
                                  setSuspensionReasonText(st.suspension_reason || '');
                                }}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Suspend / Update Status"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeletingStudent(st)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLASSES TAB                                                               */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Class Levels & Educational Tiers</span>
              <p className="text-[11px] text-slate-500">Configure Primary, JSS, and SSS cohorts across Edo basic education hierarchy.</p>
            </div>
            <button
              onClick={() => {
                setEditingClass(null);
                setNewClass({ name: '', category: 'Primary', arm_count: 2, capacity: 40, class_teacher: '' });
                setShowAddClassModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs border border-orange-400"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class Level</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => {
              const enrolledInClass = students.filter(s => s.class_id === cls.id).length;
              return (
                <div key={cls.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-900 border border-orange-200 font-black text-[10px] uppercase rounded">
                        {cls.category}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-1.5">{cls.name}</h4>
                      <p className="text-xs text-slate-500">Teacher: <strong className="text-slate-700">{cls.class_teacher}</strong></p>
                    </div>
                    <GraduationCap className="w-6 h-6 text-orange-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Class Arms</span>
                      <strong className="text-slate-800">{cls.arm_count} Arms (A, B)</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Enrolled Candidates</span>
                      <strong className="text-orange-950 font-bold">{enrolledInClass} / {cls.capacity}</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => openBulkClassAssignment(cls)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                      title="Bulk add existing pupils to this class"
                    >
                      <Users className="w-3 h-3" /> Add Pupils
                    </button>
                    <button
                      onClick={() => {
                        setEditingClass(cls);
                        setNewClass({
                          name: cls.name,
                          category: cls.category,
                          arm_count: cls.arm_count,
                          capacity: cls.capacity,
                          class_teacher: cls.class_teacher
                        });
                        setShowAddClassModal(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    {classes.length > 1 && (
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCHOOLS TAB                                                               */}
      {/* ========================================================================= */}
      {activeTab === 'schools' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Participating Edo State Public Schools</span>
              <p className="text-[11px] text-slate-500">Universal Basic Education schools operating with EARPMS computerized exams.</p>
            </div>
            <button
              onClick={() => setShowAddSchoolModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs border border-orange-400"
            >
              <Plus className="w-4 h-4" />
              <span>Register New School</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map(school => {
              const enrolled = students.filter(s => s.school_id === school.id).length;
              return (
                <div key={school.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-orange-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-orange-900 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {school.code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1.5">{school.name}</h4>
                      <p className="text-xs text-slate-500">LGA: <strong className="text-slate-800">{school.lga}</strong></p>
                    </div>
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                        Head: <strong className="text-slate-800">{school.head_teacher || 'Not Assigned'}</strong>
                      </span>
                      <span className="font-bold text-orange-950 bg-orange-50 px-2 py-0.5 rounded">{enrolled} Pupils</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditSchool(school)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-200 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit School
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPrincipalAssignment(school)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl border border-orange-400 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {school.principal_user_id ? 'Change Principal' : 'Assign Principal'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACADEMIC CALENDAR & SESSIONS TAB                                          */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Academic Sessions & Term Schedules</span>
              <p className="text-[11px] text-slate-500">Configure academic years and set active term for statewide terminal report cards.</p>
            </div>
            <button
              onClick={() => {
                setEditingSession(null);
                setNewSession({ name: '2026/2027 Academic Session', start_date: '2026-09-14', end_date: '2027-07-25', is_active: false });
                setShowAddSessionModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs border border-orange-400"
            >
              <Plus className="w-4 h-4" />
              <span>Add Academic Session</span>
            </button>
          </div>

          <div className="space-y-4">
            {sessions.map(sess => {
              const sessionTerms = terms.filter(t => t.session_id === sess.id);
              return (
                <div key={sess.id} className={`p-5 bg-white rounded-2xl border ${sess.is_active ? 'border-orange-400 shadow-md ring-2 ring-orange-400/20' : 'border-slate-200'} space-y-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${sess.is_active ? 'bg-orange-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{sess.name}</h4>
                          {sess.is_active && (
                            <span className="px-2.5 py-0.5 bg-orange-500 text-slate-950 text-[10px] font-black rounded-full uppercase">
                              Active Session
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Period: {sess.start_date || 'Sept 2025'} – {sess.end_date || 'July 2026'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!sess.is_active && (
                        <button
                          onClick={() => handleSetActiveSession(sess.id)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Set as Active
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingSession(sess);
                          setNewSession({
                            name: sess.name,
                            start_date: sess.start_date || '2025-09-08',
                            end_date: sess.end_date || '2026-07-20',
                            is_active: sess.is_active
                          });
                          setShowAddSessionModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg cursor-pointer"
                        title="Edit Session"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {sessions.length > 1 && (
                        <button
                          onClick={() => handleDeleteSession(sess.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Terminal Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {sessionTerms.map(term => (
                      <div
                        key={term.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          term.is_active
                            ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{term.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {term.is_active ? 'Current Grading Term' : 'Archived / Upcoming'}
                          </span>
                        </div>
                        {term.is_active ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActiveTerm(term.id)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-300 cursor-pointer"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBJECTS TAB                                                              */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-800">Official Curriculum Subjects</span>
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-xs border border-orange-400"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {subjects.map(sub => (
              <div key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-orange-300 transition-colors">
                <div>
                  <span className="font-mono text-[10px] font-bold text-orange-900 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    {sub.code}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{sub.name}</h4>
                  <span className="text-[11px] text-slate-500">{sub.category} Category</span>
                </div>
                <BookOpen className="w-5 h-5 text-orange-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PUPIL PROFILE                                                 */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-slate-950 font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Pupil Information</h3>
                  <p className="text-xs text-slate-500">Update biodata, admission records, attendance, and conduct.</p>
                </div>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Pupil Name</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.full_name}
                  onChange={e => setEditStudentForm({ ...editStudentForm, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Admission Number</label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.admission_number}
                    onChange={e => setEditStudentForm({ ...editStudentForm, admission_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={editStudentForm.gender}
                    onChange={e => setEditStudentForm({ ...editStudentForm, gender: e.target.value as 'M' | 'F' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={editStudentForm.guardian_name}
                    onChange={e => setEditStudentForm({ ...editStudentForm, guardian_name: e.target.value })}
                    placeholder="e.g. Mr. Osahon Sr."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={editStudentForm.guardian_phone}
                    onChange={e => setEditStudentForm({ ...editStudentForm, guardian_phone: e.target.value })}
                    placeholder="e.g. 08031122334"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attendance Days</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={editStudentForm.attendance_days}
                    onChange={e => setEditStudentForm({ ...editStudentForm, attendance_days: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Term Days</label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={editStudentForm.total_days}
                    onChange={e => setEditStudentForm({ ...editStudentForm, total_days: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Conduct Rating</label>
                  <select
                    value={editStudentForm.conduct_rating}
                    onChange={e => setEditStudentForm({ ...editStudentForm, conduct_rating: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Candidate Enrollment Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editStudentForm.status}
                    onChange={e => setEditStudentForm({ ...editStudentForm, status: e.target.value as StudentStatus })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                  >
                    <option value="active">Active Enrolled</option>
                    <option value="suspended">Suspended</option>
                    <option value="transferred">Transferred</option>
                    <option value="graduated">Graduated</option>
                  </select>
                  {editStudentForm.status === 'suspended' && (
                    <input
                      type="text"
                      placeholder="Reason for suspension..."
                      value={editStudentForm.suspension_reason}
                      onChange={e => setEditStudentForm({ ...editStudentForm, suspension_reason: e.target.value })}
                      className="w-full p-2 bg-white border border-rose-300 rounded-lg text-rose-900"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs border border-orange-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROMOTE STUDENT TO CLASS                                           */}
      {/* ========================================================================= */}
      {promotingStudent && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Promote Candidate</h3>
                  <p className="text-xs text-slate-500">Advance {promotingStudent.full_name} to higher class level.</p>
                </div>
              </div>
              <button onClick={() => setPromotingStudent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePromoteStudentSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Current Class Level:</span>
                <strong className="text-sm text-slate-900">
                  {classes.find(c => c.id === promotingStudent.class_id)?.name || 'Current Class'}
                </strong>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Class Level</label>
                <select
                  value={promoteTargetClassId}
                  onChange={e => setPromoteTargetClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Promotion Authorization Note</label>
                <textarea
                  rows={3}
                  value={promoteNote}
                  onChange={e => setPromoteNote(e.target.value)}
                  placeholder="e.g. Promoted in recognition of terminal examination aggregate."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPromotingStudent(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Confirm Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRANSFER STUDENT TO SCHOOL                                         */}
      {/* ========================================================================= */}
      {transferringStudent && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Transfer School</h3>
                  <p className="text-xs text-slate-500">Relocate {transferringStudent.full_name} to another school.</p>
                </div>
              </div>
              <button onClick={() => setTransferringStudent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferStudentSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Current School:</span>
                <strong className="text-sm text-slate-900">
                  {schools.find(s => s.id === transferringStudent.school_id)?.name || 'Current School'}
                </strong>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Edo State School</label>
                <select
                  value={transferTargetSchoolId}
                  onChange={e => setTransferTargetSchoolId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.lga} LGA)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transfer Justification / Statutory Reason</label>
                <textarea
                  rows={3}
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  placeholder="e.g. Parental relocation to Ikpoba-Okha LGA."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Authorize Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUSPEND / STATUS CHANGE                                            */}
      {/* ========================================================================= */}
      {suspendingStudent && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Change Enrollment Status</h3>
                  <p className="text-xs text-slate-500">Candidate: {suspendingStudent.full_name}</p>
                </div>
              </div>
              <button onClick={() => setSuspendingStudent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSetStatusSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Status</label>
                <select
                  value={suspensionStatusTarget}
                  onChange={e => setSuspensionStatusTarget(e.target.value as StudentStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  <option value="active">Active (Full Registration)</option>
                  <option value="suspended">Suspended (Temporary Bar)</option>
                  <option value="transferred">Transferred Out</option>
                  <option value="graduated">Graduated (Completed Tier)</option>
                </select>
              </div>

              {suspensionStatusTarget === 'suspended' && (
                <div>
                  <label className="font-bold text-rose-700 block mb-1">Administrative Suspension Reason</label>
                  <textarea
                    rows={3}
                    value={suspensionReasonText}
                    onChange={e => setSuspensionReasonText(e.target.value)}
                    placeholder="e.g. Disciplinary suspension pending academic review."
                    className="w-full p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 font-medium"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSuspendingStudent(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Apply Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE INDIVIDUAL PUPIL                                            */}
      {/* ========================================================================= */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Candidate Record</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Are you sure you want to permanently delete candidate <strong>{deletingStudent.full_name}</strong> ({deletingStudent.admission_number}) from the official registry?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 text-xs">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudentSubmit}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK ENROLLMENT PARSER                                             */}
      {/* ========================================================================= */}
      {showBulkEnrollModal && (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Bulk Pupil Enrollment (CSV Upload)</h3>
                  <p className="text-xs text-slate-500">Enroll hundreds of candidates in a single batch with automated school and class mapping.</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkEnrollModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Template trigger */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-orange-50/80 rounded-2xl border border-orange-200 text-xs">
              <div className="flex items-center gap-2 text-orange-950 font-medium">
                <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                <span>Upload a CSV file or paste raw table data below.</span>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-orange-100 text-orange-800 font-bold rounded-lg border border-orange-300 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template (.CSV)</span>
              </button>
            </div>

            {/* File Selector Dropzone */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-orange-400 transition-colors bg-slate-50/60">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block space-y-1">
                <Upload className="w-6 h-6 text-orange-500 mx-auto" />
                <span className="font-bold text-xs text-slate-800 block">Click to select .CSV file from device</span>
                <span className="text-[11px] text-slate-400 block">Comma-separated file with candidate records</span>
              </label>
            </div>

            {/* Raw Text Input Box */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-xs text-slate-700">Or Paste CSV Raw Text Directly:</label>
                {bulkCsvText && (
                  <button
                    onClick={() => {
                      setBulkCsvText('');
                      setBulkParsedRows([]);
                      setBulkParseErrors([]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={bulkCsvText}
                onChange={e => {
                  setBulkCsvText(e.target.value);
                  parseCsvText(e.target.value);
                }}
                placeholder="Full Name,Admission Number,School Code,Class Name,Gender,Guardian Name,Guardian Phone&#10;Eseosa Igbinosa,EDS/ASR/2026/088,EDS-ASR-004,Primary 6,F,Mrs. Igbinosa,08099887766"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
              />
            </div>

            {/* Parsing Errors & Warnings */}
            {bulkParseErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                <strong className="flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  CSV Parsing Warnings ({bulkParseErrors.length}):
                </strong>
                <ul className="list-disc list-inside text-[11px] max-h-24 overflow-y-auto space-y-0.5">
                  {bulkParseErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Live Preview Table */}
            {bulkParsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Successfully Parsed {bulkParsedRows.length} Candidate Records:
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">Ready to commit</span>
                </div>

                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Candidate Name</th>
                        <th className="py-2 px-3">Admission No</th>
                        <th className="py-2 px-3">Assigned School</th>
                        <th className="py-2 px-3">Class</th>
                        <th className="py-2 px-3">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {bulkParsedRows.map((r, i) => {
                        const sch = schools.find(s => s.id === r.school_id);
                        const cls = classes.find(c => c.id === r.class_id);
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">{r.full_name}</td>
                            <td className="py-1.5 px-3 font-mono">{r.admission_number}</td>
                            <td className="py-1.5 px-3 text-slate-600">{sch?.name}</td>
                            <td className="py-1.5 px-3 font-semibold">{cls?.name}</td>
                            <td className="py-1.5 px-3">{r.gender}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowBulkEnrollModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitBulkEnrollment}
                disabled={bulkParsedRows.length === 0}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs border border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Enroll {bulkParsedRows.length} Pupils</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK PROMOTE                                                       */}
      {/* ========================================================================= */}
      {showBulkPromoteModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Bulk Promote Candidates</h3>
                  <p className="text-xs text-slate-500">Promote {selectedStudentIds.length} selected pupils together.</p>
                </div>
              </div>
              <button onClick={() => setShowBulkPromoteModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkPromoteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Class Level</label>
                <select
                  value={promoteTargetClassId}
                  onChange={e => setPromoteTargetClassId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkPromoteModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Promote {selectedStudentIds.length} Pupils
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK TRANSFER                                                      */}
      {/* ========================================================================= */}
      {showBulkTransferModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Bulk Transfer Candidates</h3>
                  <p className="text-xs text-slate-500">Transfer {selectedStudentIds.length} pupils to another school.</p>
                </div>
              </div>
              <button onClick={() => setShowBulkTransferModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Edo State School</label>
                <select
                  value={transferTargetSchoolId}
                  onChange={e => setTransferTargetSchoolId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.lga} LGA)</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkTransferModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Transfer {selectedStudentIds.length} Pupils
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK SUSPEND / STATUS                                              */}
      {/* ========================================================================= */}
      {showBulkSuspendModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Bulk Update Status</h3>
                  <p className="text-xs text-slate-500">Apply status to {selectedStudentIds.length} selected pupils.</p>
                </div>
              </div>
              <button onClick={() => setShowBulkSuspendModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSuspendSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Target</label>
                <select
                  value={suspensionStatusTarget}
                  onChange={e => setSuspensionStatusTarget(e.target.value as StudentStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="transferred">Transferred</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>

              {suspensionStatusTarget === 'suspended' && (
                <div>
                  <label className="font-bold text-rose-700 block mb-1">Administrative Suspension Reason</label>
                  <textarea
                    rows={2}
                    value={suspensionReasonText}
                    onChange={e => setSuspensionReasonText(e.target.value)}
                    placeholder="e.g. Disciplinary suspension."
                    className="w-full p-2 bg-rose-50 border border-rose-300 rounded-xl text-rose-900"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBulkSuspendModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Apply to {selectedStudentIds.length} Pupils
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SINGLE STUDENT                                                 */}
      {/* ========================================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Enroll Individual Pupil</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Pupil Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.full_name}
                  onChange={e => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  placeholder="e.g. Osahon Igbinadolor"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Admission Number</label>
                  <input
                    type="text"
                    required
                    value={newStudent.admission_number}
                    onChange={e => setNewStudent({ ...newStudent, admission_number: e.target.value })}
                    placeholder="e.g. EDS/EM/2026/020"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={e => setNewStudent({ ...newStudent, gender: e.target.value as 'M' | 'F' })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned School</label>
                <select
                  value={newStudent.school_id}
                  onChange={e => setNewStudent({ ...newStudent, school_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                >
                  {schools.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name} ({sc.lga})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Level</label>
                <select
                  value={newStudent.class_id}
                  onChange={e => setNewStudent({ ...newStudent, class_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                >
                  {classes.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.name} ({cl.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={newStudent.guardian_name}
                    onChange={e => setNewStudent({ ...newStudent, guardian_name: e.target.value })}
                    placeholder="e.g. Mr. Osahon Sr."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={newStudent.guardian_phone}
                    onChange={e => setNewStudent({ ...newStudent, guardian_phone: e.target.value })}
                    placeholder="e.g. 08031122334"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs border border-orange-400"
                >
                  Enroll Pupil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD/EDIT CLASS                                                     */}
      {/* ========================================================================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingClass ? 'Edit Class Level' : 'Create New Class Level'}
              </h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Level Name</label>
                <input
                  type="text"
                  required
                  value={newClass.name}
                  onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="e.g. Primary 6, JSS 2, SSS 1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Educational Category</label>
                <select
                  value={newClass.category}
                  onChange={e => setNewClass({ ...newClass, category: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                >
                  <option value="Primary">Primary (Basic 1 - 6)</option>
                  <option value="Junior Secondary">Junior Secondary (JSS 1 - 3)</option>
                  <option value="Senior Secondary">Senior Secondary (SSS 1 - 3)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Number of Arms</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newClass.arm_count}
                    onChange={e => setNewClass({ ...newClass, arm_count: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pupil Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newClass.capacity}
                    onChange={e => setNewClass({ ...newClass, capacity: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs border border-orange-400"
                >
                  {editingClass ? 'Update Class' : 'Save Class Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK ADD EXISTING PUPILS TO CLASS                                  */}
      {/* ========================================================================= */}
      {showBulkClassAssignmentModal && bulkClassTarget && (
        <div className="fixed inset-0 bg-slate-950/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">Bulk Add Pupils to {bulkClassTarget.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Select existing pupil records and assign them to this class. No duplicate pupil records are created.
                </p>
              </div>
              <button
                onClick={() => setShowBulkClassAssignmentModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              ><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="font-bold text-slate-700">
                  Current enrollment: <span className="text-orange-600">{students.filter(st => st.class_id === bulkClassTarget.id && (st.status || 'active') === 'active').length}</span>
                  {bulkClassTarget.capacity ? <> / {bulkClassTarget.capacity}</> : null}
                </div>
                <div className="font-bold text-emerald-700">Selected: {bulkClassStudentIds.length}</div>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={bulkClassSearch}
                  onChange={e => setBulkClassSearch(e.target.value)}
                  placeholder="Search pupil name or admission number..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkClassStudentIds(prev => Array.from(new Set([...prev, ...bulkClassCandidates.map(st => st.id)])))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                >Select All Results</button>
                <button
                  type="button"
                  onClick={() => setBulkClassStudentIds([])}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                >Clear</button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {bulkClassCandidates.map(st => {
                  const checked = bulkClassStudentIds.includes(st.id);
                  const alreadyInClass = st.class_id === bulkClassTarget.id;
                  return (
                    <label key={st.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setBulkClassStudentIds(prev => checked ? prev.filter(id => id !== st.id) : [...prev, st.id])}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">{st.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{st.admission_number}</div>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${alreadyInClass ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {alreadyInClass ? 'Already Here' : (classes.find(c => c.id === st.class_id)?.name || 'Unassigned')}
                      </span>
                    </label>
                  );
                })}
              </div>
              {bulkClassCandidates.length === 0 && <div className="py-10 text-center text-xs text-slate-400">No pupil records match your search.</div>}
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-500">Pupils already in this class are harmlessly ignored.</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowBulkClassAssignmentModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
                <button
                  type="button"
                  disabled={!bulkClassStudentIds.length}
                  onClick={handleBulkClassAssignment}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                >Add {bulkClassStudentIds.length || ''} Pupils</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD/EDIT SESSION                                                   */}
      {/* ========================================================================= */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingSession ? 'Edit Academic Session' : 'Create Academic Session'}
              </h3>
              <button onClick={() => setShowAddSessionModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSession} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={newSession.name}
                  onChange={e => setNewSession({ ...newSession, name: e.target.value })}
                  placeholder="e.g. 2026/2027 Academic Session"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newSession.start_date}
                    onChange={e => setNewSession({ ...newSession, start_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newSession.end_date}
                    onChange={e => setNewSession({ ...newSession, end_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Set as Current Active Session</span>
                  <span className="text-[11px] text-slate-500">Makes this the default session for exams and report cards</span>
                </div>
                <input
                  type="checkbox"
                  checked={newSession.is_active}
                  onChange={e => setNewSession({ ...newSession, is_active: e.target.checked })}
                  className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs border border-orange-400"
                >
                  {editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SCHOOL                                                         */}
      {/* ========================================================================= */}
      {showAddSchoolModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Register School</h3>
            <form onSubmit={handleAddSchool} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={newSchool.name}
                  onChange={e => setNewSchool({ ...newSchool, name: e.target.value })}
                  placeholder="e.g. Asoro Grammar School"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">School Code</label>
                <input
                  type="text"
                  required
                  value={newSchool.code}
                  onChange={e => setNewSchool({ ...newSchool, code: e.target.value })}
                  placeholder="e.g. EDS-ASR-004"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">LGA</label>
                <select
                  value={newSchool.lga}
                  onChange={e => setNewSchool({ ...newSchool, lga: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Oredo">Oredo</option>
                  <option value="Ikpoba-Okha">Ikpoba-Okha</option>
                  <option value="Egor">Egor</option>
                  <option value="Esan West">Esan West</option>
                  <option value="Etsako West">Etsako West</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Head Teacher / Principal <span className="font-normal text-slate-400">(Optional)</span></label>
                <input
                  type="text"
                  value={newSchool.head_teacher}
                  onChange={e => setNewSchool({ ...newSchool, head_teacher: e.target.value })}
                  placeholder="Leave blank and assign a Principal later"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
                <p className="mt-1 text-[10px] text-slate-500">You can register the school first, then assign an existing Principal account from the school list.</p>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSchoolModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Save School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SCHOOL                                                       */}
      {/* ========================================================================= */}
      {editingSchool && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[86vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit School</h3>
                <p className="text-[11px] text-slate-500">Update the school master record. Principal assignment is managed separately.</p>
              </div>
              <button type="button" onClick={() => setEditingSchool(null)} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSchoolEdit} className="space-y-3 text-xs flex-1 min-h-0 overflow-y-auto earpms-modal-scroll px-6 py-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">School Name</label>
                <input
                  type="text" required value={editingSchool.name}
                  onChange={e => setEditingSchool({ ...editingSchool, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">School Code</label>
                <input
                  type="text" required value={editingSchool.code}
                  onChange={e => setEditingSchool({ ...editingSchool, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">LGA</label>
                <select
                  value={editingSchool.lga}
                  onChange={e => setEditingSchool({ ...editingSchool, lga: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  {['Oredo','Ikpoba-Okha','Egor','Esan West','Etsako West','Akoko-Edo','Esan Central','Esan North-East','Esan South-East','Igueben','Owan East','Owan West','Etsako Central','Etsako East','Esan South-West','Orhionmwon','Uhunmwode','Ovia North-East','Ovia South-West'].map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Address</label>
                <textarea
                  rows={2} value={editingSchool.address}
                  onChange={e => setEditingSchool({ ...editingSchool, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 resize-none"
                />
              </div>
              {/* BULK ADD EXISTING PUPILS TO THIS SCHOOL */}
              <div className="mt-2 rounded-2xl border border-orange-200 bg-orange-50/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSchoolBulkPupils(v => !v)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-orange-100/60 transition-colors"
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Add Pupils in Bulk</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">Search existing pupil records and move selected pupils into this school.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-white border border-orange-200 px-2 py-1 text-[10px] font-bold text-orange-800">{schoolBulkStudentIds.length} selected</span>
                    <ChevronDown className={`w-4 h-4 text-orange-700 transition-transform ${showSchoolBulkPupils ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {showSchoolBulkPupils && (
                  <div className="px-4 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="text-[10px] text-slate-600">Select active pupil records below.</div>
                    </div>

                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={schoolBulkSearch}
                      onChange={e => setSchoolBulkSearch(e.target.value)}
                      placeholder="Search name, admission no., school or class..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSchoolBulkSelectVisible}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-bold text-slate-700 whitespace-nowrap"
                  >
                    {schoolBulkCandidates.length > 0 &&
                    schoolBulkCandidates.every(st => schoolBulkStudentIds.includes(st.id))
                      ? 'Clear Visible'
                      : 'Select Visible'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {schoolBulkCandidates.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-500">
                      No active pupils match your search.
                    </div>
                  ) : (
                    schoolBulkCandidates.map(st => {
                      const currentSchool = schools.find(sc => sc.id === st.school_id);
                      const pupilClass = classes.find(c => c.id === st.class_id);
                      const selected = schoolBulkStudentIds.includes(st.id);
                      const alreadyHere = st.school_id === editingSchool.id;

                      return (
                        <label
                          key={st.id}
                          className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer ${
                            selected ? 'bg-orange-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={alreadyHere}
                            onChange={() => handleSchoolBulkToggle(st.id)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 truncate">{st.full_name}</div>
                            <div className="text-[10px] text-slate-500">
                              {st.admission_number} · {pupilClass?.name || 'Class not assigned'}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-[10px] font-bold ${alreadyHere ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {alreadyHere ? 'Already here' : 'Current school'}
                            </div>
                            <div className="text-[10px] text-slate-500 max-w-[150px] truncate">
                              {currentSchool?.name || 'Unassigned'}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 mt-3">
                  <div className="text-[10px] text-slate-500">
                    {schoolBulkCandidates.length} pupil{schoolBulkCandidates.length === 1 ? '' : 's'} found.
                    {' '}Selected pupils will be moved to <strong>{editingSchool.name}</strong>.
                  </div>
                  <button
                    type="button"
                    disabled={!schoolBulkStudentIds.length}
                    onClick={handleAddPupilsToSchool}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold rounded-xl"
                  >
                    Add Selected ({schoolBulkStudentIds.length})
                  </button>
                </div>
              </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-slate-200 bg-white sticky bottom-0 pb-1">
                <button type="button" onClick={() => setEditingSchool(null)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN PRINCIPAL                                                   */}
      {/* ========================================================================= */}
      {assigningPrincipalSchool && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Assign Principal</h3>
                <p className="text-[11px] text-slate-500">
                  {assigningPrincipalSchool.name} · {assigningPrincipalSchool.lga}
                </p>
              </div>
              <button type="button" onClick={() => setAssigningPrincipalSchool(null)} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignPrincipal} className="space-y-4 text-xs">
              <div className="rounded-xl bg-orange-50 border border-orange-200 p-3">
                <div className="font-bold text-orange-950">Current Principal</div>
                <div className="mt-1 text-slate-700">{assigningPrincipalSchool.head_teacher || 'Not Assigned'}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Active Principal Account</label>
                <select
                  required value={selectedPrincipalId}
                  onChange={e => setSelectedPrincipalId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 cursor-pointer"
                >
                  <option value="">Select principal...</option>
                  {storeState.users
                    .filter((u: User) => u.role === 'principal' && u.is_active)
                    .map((u: User) => {
                      const assignedSchool = schools.find(s => s.principal_user_id === u.id);
                      const isCurrent = u.id === assigningPrincipalSchool.principal_user_id;
                      return (
                        <option key={u.id} value={u.id} disabled={Boolean(assignedSchool && !isCurrent)}>
                          {u.full_name}{assignedSchool && !isCurrent ? ` — assigned to ${assignedSchool.name}` : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                A principal can be assigned to only one school. The principal's account <strong>school_id</strong> will be synchronized automatically, and the change will be written to the Audit Trail.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setAssigningPrincipalSchool(null)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl cursor-pointer">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SUBJECT                                                        */}
      {/* ========================================================================= */}

      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Add Curriculum Subject</h3>
            <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g. Agricultural Science"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={newSubject.code}
                  onChange={e => setNewSubject({ ...newSubject, code: e.target.value })}
                  placeholder="e.g. AGR"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newSubject.category}
                  onChange={e => setNewSubject({ ...newSubject, category: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Core">Core</option>
                  <option value="Vocational">Vocational</option>
                  <option value="Language">Language</option>
                  <option value="Science">Science</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
