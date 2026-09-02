$ErrorActionPreference = "Stop"

$Project = (Get-Location).Path
$Source = Join-Path $Project "frontend\src\components\AcademicSetupView.tsx"
$DbCandidates = @(
  (Join-Path $Project "backend\earpms_dev.db"),
  (Join-Path $Project "backend\app.db"),
  (Join-Path $Project "backend\database.db"),
  (Join-Path $Project "earpms_dev.db")
)

Write-Host ""
Write-Host "EARPMS SAFE PATCH v3 - Edit School / Bulk Add Existing Pupils" -ForegroundColor Cyan
Write-Host "Project: $Project"
Write-Host "IMPORTANT: This patch does NOT reset, delete, seed, migrate, or restore database records." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $Source)) {
    throw "AcademicSetupView.tsx was not found at: $Source"
}

# -----------------------------
# BACKUP FIRST - BEFORE SOURCE CHANGE
# -----------------------------
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Backup = Join-Path $Project "_EARPMS_BACKUP_BEFORE_SCHOOL_BULK_PUPILS_$stamp"
New-Item -ItemType Directory -Path $Backup -Force | Out-Null

Copy-Item $Source (Join-Path $Backup "AcademicSetupView.tsx") -Force

foreach ($db in $DbCandidates) {
    if (Test-Path $db) {
        $relative = $db.Substring($Project.Length).TrimStart('\')
        $dest = Join-Path $Backup $relative
        $destDir = Split-Path $dest -Parent
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Copy-Item $db $dest -Force
        Write-Host "Backed up DB: $relative" -ForegroundColor Green
    }
}

# Back up other relevant source/config files if present.
foreach ($rel in @(
    "frontend\src\lib\store.ts",
    "frontend\src\types.ts",
    "backend\.env",
    ".env"
)) {
    $p = Join-Path $Project $rel
    if (Test-Path $p) {
        $dest = Join-Path $Backup $rel
        New-Item -ItemType Directory -Path (Split-Path $dest -Parent) -Force | Out-Null
        Copy-Item $p $dest -Force
    }
}

Write-Host "Backup: $Backup" -ForegroundColor Green

$s = Get-Content $Source -Raw -Encoding UTF8

# Idempotence.
if ($s.Contains("schoolBulkSearch")) {
    Write-Host "The School Bulk Pupils feature is already present. No source changes were made." -ForegroundColor Yellow
    Write-Host "Backup remains at: $Backup" -ForegroundColor Green
    exit 0
}

# -----------------------------
# 1. ADD STATE
# -----------------------------
$stateAnchor = @"
  const [bulkClassSearch, setBulkClassSearch] = useState('');
  const [bulkClassStudentIds, setBulkClassStudentIds] = useState<string[]>([]);
"@

$stateInsert = @"
  const [bulkClassSearch, setBulkClassSearch] = useState('');
  const [bulkClassStudentIds, setBulkClassStudentIds] = useState<string[]>([]);

  // Bulk add existing pupils to the school from the Edit School dialog.
  const [schoolBulkSearch, setSchoolBulkSearch] = useState('');
  const [schoolBulkStudentIds, setSchoolBulkStudentIds] = useState<string[]>([]);
"@

if (-not $s.Contains($stateAnchor)) {
    throw "Could not find the bulk class state anchor in the current AcademicSetupView.tsx. No source changes were made."
}
$s = $s.Replace($stateAnchor, $stateInsert)

# -----------------------------
# 2. ADD FILTERED SCHOOL PUPILS + HANDLER
# Insert immediately before handleOpenPrincipalAssignment.
# -----------------------------
$handlerAnchor = @"
  const handleOpenPrincipalAssignment = (school: School) => {
"@

$handlerCode = @'
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

$handlerAnchor
'@

if (-not $s.Contains($handlerAnchor)) {
    throw "Could not find the principal-assignment handler anchor. No source changes were made."
}
$s = $s.Replace($handlerAnchor, $handlerCode)

# -----------------------------
# 3. ADD BULK PUPIL UI INSIDE EDIT SCHOOL MODAL
# Replace the exact beginning of the existing form body.
# -----------------------------
$formAnchor = @"
              <div>
                <label className="font-bold text-slate-700 block mb-1">Address</label>
                <textarea
                  rows={2} value={editingSchool.address}
                  onChange={e => setEditingSchool({ ...editingSchool, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
"@

$formInsert = @'
              <div>
                <label className="font-bold text-slate-700 block mb-1">Address</label>
                <textarea
                  rows={2} value={editingSchool.address}
                  onChange={e => setEditingSchool({ ...editingSchool, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 resize-none"
                />
              </div>

              {/* BULK ADD EXISTING PUPILS TO THIS SCHOOL */}
              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Add Pupils in Bulk</h4>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Search existing pupil records and enroll them in this school. Their admission number and class are preserved.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white border border-orange-200 px-2 py-1 text-[10px] font-bold text-orange-800">
                    {schoolBulkStudentIds.length} selected
                  </span>
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
'@

if (-not $s.Contains($formAnchor)) {
    throw "Could not find the exact Edit School Address/form anchor in the current source. No source changes were made."
}
$s = $s.Replace($formAnchor, $formInsert)

# -----------------------------
# WRITE SOURCE
# -----------------------------
Set-Content -Path $Source -Value $s -Encoding UTF8

Write-Host ""
Write-Host "PATCH COMPLETE." -ForegroundColor Green
Write-Host "Updated: frontend\src\components\AcademicSetupView.tsx" -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor Green
Write-Host ""
Write-Host "NO DATABASE RESET WAS PERFORMED." -ForegroundColor Cyan
Write-Host "NO DATABASE RECORDS WERE DELETED." -ForegroundColor Cyan
Write-Host "NO OLD DATA WAS RESTORED." -ForegroundColor Cyan
Write-Host ""
Write-Host "Restart EARPMS after this script completes." -ForegroundColor Yellow
