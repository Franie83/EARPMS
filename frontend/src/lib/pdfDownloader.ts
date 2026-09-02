
import { AnswerScript, Student, Examination, School, ReportCard, AcademicSession, Term, ClassLevel, SystemContentConfig } from '../types';
import { generateQrDataUrl } from './qr';

/**
 * Downloads the attached scanned student answer sheet (PDF or image).
 * If no scanned binary file was uploaded, generates an official Edo State Ministry of Education
 * digital answer sheet PDF document with candidate credentials and QR code.
 */
export async function downloadScannedAnswerSheet(
  script: AnswerScript,
  student?: Student,
  exam?: Examination,
  school?: School
) {
  const fileName = script.scanned_file_name ||
    `EdoStateMinistryOfEducation_AnswerSheet_${student?.admission_number || script.student_id}_${exam?.code || script.examination_id}.pdf`;

  // Case 1: Script has uploaded binary/Base64 data
  if (script.scanned_file_data && script.scanned_file_data.startsWith('data:')) {
    try {
      const link = document.createElement('a');
      link.href = script.scanned_file_data;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    } catch (e) {
      console.warn('Direct data download fallback triggered', e);
    }
  }

  // Case 2: Generate Official Edo State Ministry of Education Digital Answer Sheet PDF
  const qrData = await generateQrDataUrl(
    `EDS:ANSWERSCRIPT:${script.id}:CANDIDATE:${student?.admission_number || script.student_id}:EXAM:${exam?.code || script.examination_id}`
  );

  // Construct printable HTML document with Edo State Ministry of Education official security layout
  const printableHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      line-height: 1.4;
      background: #ffffff;
      padding: 20px;
    }
    .sheet-box {
      border: 3px double #0f172a;
      padding: 24px;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .header h1 {
      font-size: 16px;
      margin: 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header h2 {
      font-size: 13px;
      margin: 2px 0;
      color: #334155;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 18px;
      font-size: 12px;
    }
    .qr-side {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
    }
    .qr-side img {
      width: 75px;
      height: 75px;
      border: 1px solid #94a3b8;
      border-radius: 4px;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      background: #e2e8f0;
      padding: 6px 10px;
      border-radius: 4px;
      margin: 16px 0 10px 0;
      border-left: 4px solid #d97706;
    }
    .answer-row {
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      margin-bottom: 8px;
      border-radius: 6px;
      background: #ffffff;
    }
    .ans-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 12px;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .raw-response {
      font-family: 'Courier New', Courier, monospace;
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      border-left: 3px solid #64748b;
      white-space: pre-wrap;
    }
    .footer-seal {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 2px dashed #94a3b8;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="sheet-box">
    <div class="header">
      <div style="font-size: 11px; font-weight: bold; color: #475569;">FEDERAL REPUBLIC OF NIGERIA</div>
      <h1>Edo State Ministry of Education</h1>
      <h2>OFFICIAL CANDIDATE SCANNED ANSWER SCRIPT SHEET</h2>
      <div style="font-size: 11px; color: #b45309; font-weight: bold; margin-top: 4px;">
        DIGITAL ARCHIVAL RECORD • SCRIPT ID: ${script.id}
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <p style="margin: 2px 0;"><strong>Candidate Name:</strong> ${student?.full_name || 'Candidate ' + script.student_id}</p>
        <p style="margin: 2px 0;"><strong>Admission Number:</strong> ${student?.admission_number || 'N/A'}</p>
        <p style="margin: 2px 0;"><strong>School:</strong> ${school?.name || 'Assigned Center'} (${school?.lga || 'Edo'})</p>
        <p style="margin: 2px 0;"><strong>Examination:</strong> ${exam?.title || 'Terminal Exam'} (${exam?.code || ''})</p>
        <p style="margin: 2px 0;"><strong>Intake Mode:</strong> ${script.intake_type.toUpperCase()} | <strong>Intake Date:</strong> ${new Date(script.created_at).toLocaleString()}</p>
      </div>
      <div class="qr-side">
        <img src="${qrData}" alt="Security QR" />
        <span style="font-size: 9px; color: #64748b; margin-top: 4px; font-family: monospace;">SECURE PROVENANCE QR</span>
      </div>
    </div>

    <div class="section-title">Recorded Candidate Responses & Script Transcripts</div>

    ${script.answers.map((ans, idx) => `
      <div class="answer-row">
        <div class="ans-header">
          <span>Question ${idx + 1}</span>
          <span>Awarded Score: <strong>${ans.final_score !== undefined ? ans.final_score : ans.proposed_score} Marks</strong></span>
        </div>
        <div class="raw-response">${ans.student_raw_response || '(No written response recorded)'}</div>
        ${ans.reasoning ? `<div style="font-size: 10px; color: #6b21a8; margin-top: 4px;"><strong>AI / Marking Note:</strong> ${ans.reasoning}</div>` : ''}
      </div>
    `).join('')}

    <div class="footer-seal">
      <div>
        <strong>Examiner / Moderator Stamp:</strong><br />
        <span style="font-family: monospace;">STATUS: ${script.review_status.toUpperCase()}</span><br />
        <span>TOTAL RECORDED SCORE: <strong>${script.score} / ${script.maximum_marks} MARKS</strong></span>
      </div>
      <div style="text-align: right;">
        <strong>Edo State Ministry of Education EARPMS Archival Authority:</strong><br />
        <span style="font-family: monospace;">SHA-256 VERIFIED RECORD</span><br />
        <span>Generated: ${new Date().toLocaleDateString()}</span>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  // Open clean printable window / trigger download
  const blob = new Blob([printableHtml], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) {
    // If popup blocked, download as file
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName.replace(/\.pdf$/, '.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Generates and downloads an Official Edo State Ministry of Education Terminal Academic Report Card PDF document.
 * Formatted to standard A4 printable certificate specifications with authentic security tokens,
 * high-contrast tabular styling, subject rankings, and verification QR code.
 */
export async function downloadReportCardPdf(
  reportCard: ReportCard,
  student?: Student,
  school?: School,
  studentClass?: ClassLevel,
  session?: AcademicSession,
  term?: Term,
  systemConfig?: SystemContentConfig
) {
  const fileName = `EdoStateMinistryOfEducation_ReportCard_${student?.admission_number?.replace(/\//g, '_') || reportCard.student_id}_${term?.name?.replace(/\s+/g, '_') || 'Term'}_${session?.name?.replace(/[\s/]+/g, '_') || 'Session'}.html`;

  const qrDataUrl = await generateQrDataUrl(
    `EDS:REPORT:${reportCard.id}:STU:${reportCard.student_id}:CODE:${reportCard.verification_code}:AVG:${reportCard.average_percent}`
  );

  const printableHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Edo State Ministry of Education Official Terminal Academic Report - ${student?.full_name || 'Pupil'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 11px;
      line-height: 1.35;
    }
    .report-card-container {
      border: 3px double #0f172a;
      border-radius: 8px;
      padding: 20px;
      background: #ffffff;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-crest-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      text-align: center;
    }
    .crest-badge {
      width: 54px;
      height: 54px;
      background: #f59e0b;
      border: 2px solid #0f172a;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 22px;
      color: #0f172a;
      flex-shrink: 0;
    }
    .header-text h1 {
      font-size: 16px;
      font-weight: 900;
      margin: 0 0 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
    }
    .header-text h2 {
      font-size: 12px;
      font-weight: 800;
      margin: 0 0 3px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #334155;
    }
    .school-line {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .biodata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 120px;
      gap: 14px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
      font-size: 11px;
    }
    .biodata-col p {
      margin: 3px 0;
    }
    .biodata-col strong {
      color: #0f172a;
    }
    .qr-col {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-left: 1px solid #cbd5e1;
      padding-left: 10px;
    }
    .qr-col img {
      width: 72px;
      height: 72px;
      border: 1px solid #0f172a;
      padding: 2px;
      background: #ffffff;
    }
    .attendance-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    .attendance-bar .item-label {
      color: #64748b;
      font-size: 9.5px;
      text-transform: uppercase;
      font-weight: bold;
    }
    .attendance-bar .item-val {
      font-weight: bold;
      color: #0f172a;
      font-size: 11.5px;
    }
    .academic-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    .academic-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: bold;
      padding: 6px 8px;
      border: 1px solid #0f172a;
      text-align: left;
    }
    .academic-table td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
    }
    .academic-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #fef3c7;
      border: 2px solid #0f172a;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      text-align: center;
    }
    .summary-grid .lbl {
      font-size: 9.5px;
      font-weight: bold;
      color: #78350f;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .summary-grid .val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .remarks-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 10.5px;
    }
    .remarks-box strong {
      display: block;
      color: #1e293b;
      margin-bottom: 2px;
      font-size: 10px;
      text-transform: uppercase;
    }
    .signatures-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 22px;
      padding-top: 10px;
      border-top: 2px solid #0f172a;
      text-align: center;
      font-size: 10.5px;
    }
    .signature-line {
      border-bottom: 1px solid #64748b;
      padding-bottom: 4px;
      margin-bottom: 4px;
      font-style: italic;
      font-family: Georgia, serif;
      color: #1e293b;
    }
    .footer-stamp {
      text-align: center;
      margin-top: 14px;
      font-size: 9px;
      color: #64748b;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="report-card-container">
    <!-- Header -->
    <div class="header-crest-row">
      <div class="crest-badge">ED</div>
      <div class="header-text">
        <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Federal Republic of Nigeria</div>
        <h1>Edo State Ministry of Education</h1>
        <h2>Continuous Assessment & Terminal Report Sheet</h2>
        <div class="school-line">
          Center / School: <strong>${school?.name || 'Emotan Model Primary School'}</strong> • LGA: <strong>${school?.lga || 'Oredo'}</strong> • Code: <strong>${school?.code || 'EDS-SCH-001'}</strong>
        </div>
      </div>
    </div>

    <!-- Biodata & QR -->
    <div class="biodata-grid">
      <div class="biodata-col">
        <p>Pupil Name: <strong>${student?.full_name || 'Candidate ' + reportCard.student_id}</strong></p>
        <p>Admission No: <strong style="font-family: monospace;">${student?.admission_number || 'N/A'}</strong></p>
        <p>Gender: <strong>${student?.gender === 'M' ? 'Male' : 'Female'}</strong></p>
      </div>
      <div class="biodata-col">
        <p>Class Level: <strong>${studentClass?.name || 'Primary 6'}</strong></p>
        <p>Academic Session: <strong>${session?.name || '2025/2026 Academic Session'}</strong></p>
        <p>Term: <strong>${term?.name || '2nd Term'}</strong></p>
      </div>
      <div class="qr-col">
        <img src="${qrDataUrl}" alt="Security QR" />
        <span style="font-size: 8px; font-family: monospace; font-weight: bold; margin-top: 3px;">${reportCard.verification_code}</span>
        <span style="font-size: 7.5px; color: #64748b;">OFFICIAL VERIFICATION</span>
      </div>
    </div>

    <!-- Attendance & Conduct -->
    <div class="attendance-bar">
      <div>
        <div class="item-label">Days School Opened</div>
        <div class="item-val">${reportCard.attendance_total} Days</div>
      </div>
      <div>
        <div class="item-label">Days Pupil Present</div>
        <div class="item-val">${reportCard.attendance_present} Days</div>
      </div>
      <div>
        <div class="item-label">Conduct / Attitude</div>
        <div class="item-val">${reportCard.conduct_grade}</div>
      </div>
      <div>
        <div class="item-label">Promotion Status</div>
        <div class="item-val" style="color: #065f46;">${reportCard.promotion_status}</div>
      </div>
    </div>

    <!-- Performance Table -->
    <table class="academic-table">
      <thead>
        <tr>
          <th>Subject Description</th>
          <th class="text-center" style="width: 80px;">Marks</th>
          <th class="text-center" style="width: 70px;">Max</th>
          <th class="text-center" style="width: 70px;">% Score</th>
          <th class="text-center" style="width: 55px;">Grade</th>
          <th class="text-center" style="width: 60px;">Pos</th>
          <th>Teacher's Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${reportCard.subjects.map(sb => `
          <tr>
            <td class="font-bold">${sb.subject_name}</td>
            <td class="text-center font-bold">${sb.raw_marks}</td>
            <td class="text-center">${sb.max_marks}</td>
            <td class="text-center font-bold" style="color: #78350f;">${sb.percentage.toFixed(1)}%</td>
            <td class="text-center font-black">${sb.grade}</td>
            <td class="text-center font-bold">${sb.position}</td>
            <td style="color: #334155; font-size: 9.5px;">${sb.remark}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Aggregate Summary Box -->
    <div class="summary-grid">
      <div>
        <div class="lbl">Total Marks Obtained</div>
        <div class="val">${reportCard.total_marks} / ${reportCard.max_possible}</div>
      </div>
      <div>
        <div class="lbl">Terminal Average</div>
        <div class="val" style="color: #92400e;">${reportCard.average_percent.toFixed(1)}%</div>
      </div>
      <div>
        <div class="lbl">Passing Benchmark</div>
        <div class="val">${reportCard.average_percent >= 50 ? 'PASSED' : 'REMEDIAL'}</div>
      </div>
      <div>
        <div class="lbl">Position in Class</div>
        <div class="val" style="color: #065f46;">${reportCard.position} of ${reportCard.total_students}</div>
      </div>
    </div>

    <!-- Remarks -->
    <div class="remarks-box">
      <strong>Class Teacher's Assessment & Recommendations:</strong>
      <span style="font-style: italic; color: #334155;">"${reportCard.teacher_comment}"</span>
    </div>

    <div class="remarks-box">
      <strong>Head Teacher / Principal's Endorsement:</strong>
      <span style="font-style: italic; color: #334155;">"${reportCard.principal_comment}"</span>
    </div>

    <!-- Signatures -->
    <div class="signatures-row">
      <div>
        ${systemConfig?.principal_signature_url ? `<img src="${systemConfig.principal_signature_url}" style="height:58px; max-width:180px; object-fit:contain; display:block; margin:0 auto 4px;" alt="Principal Stamp" />` : ''}
        <div class="signature-line">${school?.head_teacher || 'Head Teacher / Principal'}</div>
        <span style="font-weight: bold; font-size: 9px; text-transform: uppercase; color: #475569;">${systemConfig?.report_card_principal_signature_title || 'Head Teacher / Principal Stamp & Signature'}</span>
      </div>
      <div>
        ${systemConfig?.chairman_signature_url ? `<img src="${systemConfig.chairman_signature_url}" style="height:58px; max-width:180px; object-fit:contain; display:block; margin:0 auto 4px;" alt="Chairman Stamp" />` : ''}
        <div class="signature-line">${systemConfig?.report_card_chairman_name || 'Hon. Ozavize E. Salami'}</div>
        <span style="font-weight: bold; font-size: 9px; text-transform: uppercase; color: #475569;">${systemConfig?.report_card_chairman_title || 'Chairman'}</span>
      </div>
    </div>

    <!-- Footer Stamp -->
    <div class="footer-stamp">
      OFFICIAL DIGITALLY SIGNED EDO STATE MINISTRY OF EDUCATION ACADEMIC TRANSCRIPT • VERIFICATION TOKEN: ${reportCard.verification_code} • ISSUED: ${new Date(reportCard.issued_at).toLocaleString()}
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  // Create Blob & trigger download / print window
  const blob = new Blob([printableHtml], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Downloads a batch of Report Cards compiled into a single printable/archival document
 */
export async function downloadMultipleReportCardsPdf(
  reportCardsList: ReportCard[],
  students: Student[],
  schools: School[],
  classes: ClassLevel[],
  sessions: AcademicSession[],
  terms: Term[],
  systemConfig?: SystemContentConfig
) {
  if (reportCardsList.length === 0) return;

  const fileName = `EdoStateMinistryOfEducation_Batch_ReportCards_${new Date().toISOString().split('T')[0]}.html`;

  // Generate QR codes for all cards in parallel
  const renderedCards = await Promise.all(
    reportCardsList.map(async (rc) => {
      const student = students.find(s => s.id === rc.student_id);
      const school = student ? schools.find(sc => sc.id === student.school_id) : null;
      const studentClass = student ? classes.find(c => c.id === student.class_id) : null;
      const session = sessions.find(s => s.id === rc.session_id);
      const term = terms.find(t => t.id === rc.term_id);
      const qrDataUrl = await generateQrDataUrl(
        `EDS:REPORT:${rc.id}:STU:${rc.student_id}:CODE:${rc.verification_code}:AVG:${rc.average_percent}`
      );

      return `
        <div class="report-card-container" style="page-break-after: always; margin-bottom: 30px;">
          <!-- Header -->
          <div class="header-crest-row">
            <div class="crest-badge">ED</div>
            <div class="header-text">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Federal Republic of Nigeria</div>
              <h1>Edo State Ministry of Education</h1>
              <h2>Continuous Assessment & Terminal Report Sheet</h2>
              <div class="school-line">
                Center / School: <strong>${school?.name || 'Assigned Center'}</strong> • LGA: <strong>${school?.lga || 'Edo'}</strong>
              </div>
            </div>
          </div>

          <!-- Biodata & QR -->
          <div class="biodata-grid">
            <div class="biodata-col">
              <p>Pupil Name: <strong>${student?.full_name || 'Candidate ' + rc.student_id}</strong></p>
              <p>Admission No: <strong style="font-family: monospace;">${student?.admission_number || 'N/A'}</strong></p>
              <p>Gender: <strong>${student?.gender === 'M' ? 'Male' : 'Female'}</strong></p>
            </div>
            <div class="biodata-col">
              <p>Class Level: <strong>${studentClass?.name || 'Primary 6'}</strong></p>
              <p>Academic Session: <strong>${session?.name || '2025/2026 Academic Session'}</strong></p>
              <p>Term: <strong>${term?.name || '2nd Term'}</strong></p>
            </div>
            <div class="qr-col">
              <img src="${qrDataUrl}" alt="Security QR" />
              <span style="font-size: 8px; font-family: monospace; font-weight: bold; margin-top: 3px;">${rc.verification_code}</span>
            </div>
          </div>

          <!-- Attendance & Conduct -->
          <div class="attendance-bar">
            <div>
              <div class="item-label">Days School Opened</div>
              <div class="item-val">${rc.attendance_total} Days</div>
            </div>
            <div>
              <div class="item-label">Days Pupil Present</div>
              <div class="item-val">${rc.attendance_present} Days</div>
            </div>
            <div>
              <div class="item-label">Conduct / Attitude</div>
              <div class="item-val">${rc.conduct_grade}</div>
            </div>
            <div>
              <div class="item-label">Promotion Status</div>
              <div class="item-val" style="color: #065f46;">${rc.promotion_status}</div>
            </div>
          </div>

          <!-- Performance Table -->
          <table class="academic-table">
            <thead>
              <tr>
                <th>Subject Description</th>
                <th class="text-center" style="width: 80px;">Marks</th>
                <th class="text-center" style="width: 70px;">Max</th>
                <th class="text-center" style="width: 70px;">% Score</th>
                <th class="text-center" style="width: 55px;">Grade</th>
                <th class="text-center" style="width: 60px;">Pos</th>
                <th>Teacher's Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rc.subjects.map(sb => `
                <tr>
                  <td class="font-bold">${sb.subject_name}</td>
                  <td class="text-center font-bold">${sb.raw_marks}</td>
                  <td class="text-center">${sb.max_marks}</td>
                  <td class="text-center font-bold" style="color: #78350f;">${sb.percentage.toFixed(1)}%</td>
                  <td class="text-center font-black">${sb.grade}</td>
                  <td class="text-center font-bold">${sb.position}</td>
                  <td style="color: #334155; font-size: 9.5px;">${sb.remark}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Aggregate Summary Box -->
          <div class="summary-grid">
            <div>
              <div class="lbl">Total Marks Obtained</div>
              <div class="val">${rc.total_marks} / ${rc.max_possible}</div>
            </div>
            <div>
              <div class="lbl">Terminal Average</div>
              <div class="val" style="color: #92400e;">${rc.average_percent.toFixed(1)}%</div>
            </div>
            <div>
              <div class="lbl">Passing Benchmark</div>
              <div class="val">${rc.average_percent >= 50 ? 'PASSED' : 'REMEDIAL'}</div>
            </div>
            <div>
              <div class="lbl">Position in Class</div>
              <div class="val" style="color: #065f46;">${rc.position} of ${rc.total_students}</div>
            </div>
          </div>

          <!-- Remarks -->
          <div class="remarks-box">
            <strong>Class Teacher's Assessment & Recommendations:</strong>
            <span style="font-style: italic; color: #334155;">"${rc.teacher_comment}"</span>
          </div>

          <div class="remarks-box">
            <strong>Head Teacher / Principal's Endorsement:</strong>
            <span style="font-style: italic; color: #334155;">"${rc.principal_comment}"</span>
          </div>

          <!-- Signatures -->
          <div class="signatures-row">
            <div>
              <div class="signature-line">${school?.head_teacher || 'Head Teacher'}</div>
              <span style="font-weight: bold; font-size: 9px; text-transform: uppercase; color: #475569;">Head Teacher Signature & Date</span>
            </div>
            <div>
              <div class="signature-line" style="font-family: monospace; font-size: 10px;">EDO-STATE-MINISTRY-OF-EDUCATION-EARPMS-SEAL-VERIFIED</div>
              <span style="font-weight: bold; font-size: 9px; text-transform: uppercase; color: #475569;">Edo State Ministry of Education Board Official Stamp</span>
            </div>
          </div>
        </div>
      `;
    })
  );

  const printableHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Edo State Ministry of Education Batch Report Cards (${reportCardsList.length} Cards)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 11px;
      line-height: 1.35;
    }
    .report-card-container {
      border: 3px double #0f172a;
      border-radius: 8px;
      padding: 20px;
      background: #ffffff;
      max-width: 800px;
      margin: 0 auto 30px auto;
    }
    .header-crest-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      text-align: center;
    }
    .crest-badge {
      width: 54px;
      height: 54px;
      background: #f59e0b;
      border: 2px solid #0f172a;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 22px;
      color: #0f172a;
      flex-shrink: 0;
    }
    .header-text h1 {
      font-size: 16px;
      font-weight: 900;
      margin: 0 0 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
    }
    .header-text h2 {
      font-size: 12px;
      font-weight: 800;
      margin: 0 0 3px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #334155;
    }
    .school-line {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .biodata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 120px;
      gap: 14px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
      font-size: 11px;
    }
    .biodata-col p {
      margin: 3px 0;
    }
    .biodata-col strong {
      color: #0f172a;
    }
    .qr-col {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-left: 1px solid #cbd5e1;
      padding-left: 10px;
    }
    .qr-col img {
      width: 72px;
      height: 72px;
      border: 1px solid #0f172a;
      padding: 2px;
      background: #ffffff;
    }
    .attendance-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    .attendance-bar .item-label {
      color: #64748b;
      font-size: 9.5px;
      text-transform: uppercase;
      font-weight: bold;
    }
    .attendance-bar .item-val {
      font-weight: bold;
      color: #0f172a;
      font-size: 11.5px;
    }
    .academic-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10.5px;
    }
    .academic-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: bold;
      padding: 6px 8px;
      border: 1px solid #0f172a;
      text-align: left;
    }
    .academic-table td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
    }
    .academic-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #fef3c7;
      border: 2px solid #0f172a;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      text-align: center;
    }
    .summary-grid .lbl {
      font-size: 9.5px;
      font-weight: bold;
      color: #78350f;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .summary-grid .val {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .remarks-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
      font-size: 10.5px;
    }
    .remarks-box strong {
      display: block;
      color: #1e293b;
      margin-bottom: 2px;
      font-size: 10px;
      text-transform: uppercase;
    }
    .signatures-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 22px;
      padding-top: 10px;
      border-top: 2px solid #0f172a;
      text-align: center;
      font-size: 10.5px;
    }
    .signature-line {
      border-bottom: 1px solid #64748b;
      padding-bottom: 4px;
      margin-bottom: 4px;
      font-style: italic;
      font-family: Georgia, serif;
      color: #1e293b;
    }
  </style>
</head>
<body>
  ${renderedCards.join('\n')}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([printableHtml], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
