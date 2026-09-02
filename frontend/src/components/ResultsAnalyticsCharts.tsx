
import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Award,
  Building2,
  MapPin,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Compass,
  ArrowUpRight,
  Sparkles,
  Download,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Examination, Result, Student, School, Subject } from '../types';
import { EDO_LGAS, EDO_LGA_NAMES } from '../lib/lgaData';

interface ResultsAnalyticsChartsProps {
  examination: Examination;
  results: Result[];
  students: Student[];
  schools: School[];
  subjects: Subject[];
}

export const ResultsAnalyticsCharts: React.FC<ResultsAnalyticsChartsProps> = ({
  examination,
  results,
  students,
  schools,
  subjects
}) => {
  const [selectedLgaFilter, setSelectedLgaFilter] = useState<string>('ALL');
  const [viewDimension, setViewDimension] = useState<'lga' | 'schools' | 'grades' | 'zones'>('lga');
  const [activeMetric, setActiveMetric] = useState<'average' | 'passRate' | 'distinctionRate' | 'candidates'>('average');
  const [chartType, setChartType] = useState<'bar' | 'area' | 'radar'>('bar');

  // Compute LGA-level performance aggregations
  const lgaData = useMemo(() => {
    // Map each result to its student and school
    const enrichedResults = results.map(r => {
      const stu = students.find(s => s.id === r.student_id);
      const sch = stu ? schools.find(s => s.id === stu.school_id) : null;
      const lga = sch?.lga || 'Oredo';
      return {
        ...r,
        student: stu,
        school: sch,
        lga
      };
    });

    // Group by LGA
    const groups: { [lga: string]: typeof enrichedResults } = {};

    // First ensure all active LGAs with schools or results are initialized
    schools.forEach(s => {
      if (!groups[s.lga]) groups[s.lga] = [];
    });

    enrichedResults.forEach(r => {
      if (!groups[r.lga]) groups[r.lga] = [];
      groups[r.lga].push(r);
    });

    // If an LGA has no results yet, synthesize realistic contextual benchmark averages from state distributions
    // or calculate directly from candidates
    return Object.keys(groups).map(lgaName => {
      const items = groups[lgaName];
      const count = items.length;
      const avg = count > 0
        ? items.reduce((sum, item) => sum + item.percentage, 0) / count
        : 0;
      
      const passBenchmark = examination.passing_percentage || 50;
      const passCount = items.filter(i => i.percentage >= passBenchmark).length;
      const passRate = count > 0 ? (passCount / count) * 100 : 0;
      const distinctionCount = items.filter(i => i.percentage >= 70).length;
      const distinctionRate = count > 0 ? (distinctionCount / count) * 100 : 0;

      const highestScore = count > 0 ? Math.max(...items.map(i => i.percentage)) : 0;
      const lowestScore = count > 0 ? Math.min(...items.map(i => i.percentage)) : 0;

      const lgaInfo = EDO_LGAS.find(l => l.name.toLowerCase() === lgaName.toLowerCase() || l.name.toLowerCase().includes(lgaName.toLowerCase()));
      const zone = lgaInfo?.zone || 'Edo South';

      return {
        lga: lgaName,
        zone,
        candidates: count,
        average: parseFloat(avg.toFixed(1)),
        passRate: parseFloat(passRate.toFixed(1)),
        distinctionRate: parseFloat(distinctionRate.toFixed(1)),
        highestScore: parseFloat(highestScore.toFixed(1)),
        lowestScore: parseFloat(lowestScore.toFixed(1)),
        passingCount: passCount,
        distinctionCount
      };
    }).sort((a, b) => b.average - a.average || b.candidates - a.candidates);
  }, [results, students, schools, examination]);

  // Compute School-level performance aggregations
  const schoolData = useMemo(() => {
    return schools.map(sch => {
      const schStudents = students.filter(s => s.school_id === sch.id);
      const schStudentIds = new Set(schStudents.map(s => s.id));
      const schResults = results.filter(r => schStudentIds.has(r.student_id));
      const count = schResults.length;

      const avg = count > 0
        ? schResults.reduce((sum, r) => sum + r.percentage, 0) / count
        : 0;

      const passBenchmark = examination.passing_percentage || 50;
      const passCount = schResults.filter(r => r.percentage >= passBenchmark).length;
      const passRate = count > 0 ? (passCount / count) * 100 : 0;
      const distinctionCount = schResults.filter(r => r.percentage >= 70).length;

      return {
        id: sch.id,
        name: sch.name.replace(' Primary School', '').replace(' Secondary School', ''),
        fullName: sch.name,
        code: sch.code,
        lga: sch.lga,
        candidates: count,
        average: parseFloat(avg.toFixed(1)),
        passRate: parseFloat(passRate.toFixed(1)),
        distinctions: distinctionCount
      };
    }).filter(s => selectedLgaFilter === 'ALL' || s.lga.toLowerCase() === selectedLgaFilter.toLowerCase())
      .sort((a, b) => b.average - a.average);
  }, [schools, students, results, examination, selectedLgaFilter]);

  // Compute Grade distribution
  const gradeDistribution = useMemo(() => {
    const counts: { [grade: string]: number } = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    
    // Filter results based on selected LGA
    const filteredResults = results.filter(r => {
      if (selectedLgaFilter === 'ALL') return true;
      const stu = students.find(s => s.id === r.student_id);
      const sch = stu ? schools.find(s => s.id === stu.school_id) : null;
      return sch?.lga?.toLowerCase() === selectedLgaFilter.toLowerCase();
    });

    filteredResults.forEach(r => {
      const g = (r.grade || 'C').toUpperCase();
      if (counts[g] !== undefined) {
        counts[g]++;
      } else {
        counts['F']++;
      }
    });

    const total = filteredResults.length || 1;
    const colors: { [key: string]: string } = {
      A: '#10b981', // Emerald
      B: '#3b82f6', // Blue
      C: '#06b6d4', // Cyan
      D: '#f59e0b', // Amber
      E: '#f97316', // Orange
      F: '#ef4444'  // Rose
    };

    return Object.entries(counts).map(([grade, count]) => ({
      name: `Grade ${grade}`,
      grade,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(1)),
      color: colors[grade] || '#64748b'
    }));
  }, [results, students, schools, selectedLgaFilter]);

  // Compute Senatorial Zone performance
  const zoneData = useMemo(() => {
    const zones = ['Edo South', 'Edo Central', 'Edo North'];
    return zones.map(zoneName => {
      const matchingLgas = lgaData.filter(l => l.zone === zoneName && l.candidates > 0);
      const totalCandidates = matchingLgas.reduce((sum, l) => sum + l.candidates, 0);
      const weightedAvg = totalCandidates > 0
        ? matchingLgas.reduce((sum, l) => sum + (l.average * l.candidates), 0) / totalCandidates
        : 0;
      const avgPassRate = matchingLgas.length > 0
        ? matchingLgas.reduce((sum, l) => sum + l.passRate, 0) / matchingLgas.length
        : 0;

      return {
        zone: zoneName,
        candidates: totalCandidates,
        average: parseFloat(weightedAvg.toFixed(1)),
        passRate: parseFloat(avgPassRate.toFixed(1)),
        lgasCount: matchingLgas.length
      };
    });
  }, [lgaData]);

  // Top summary KPIs
  const topLga = lgaData.find(l => l.candidates > 0) || lgaData[0];
  const totalStatewideCandidates = results.length;
  const overallMean = totalStatewideCandidates > 0
    ? (results.reduce((sum, r) => sum + r.percentage, 0) / totalStatewideCandidates).toFixed(1)
    : '0.0';
  const overallPassRate = totalStatewideCandidates > 0
    ? ((results.filter(r => r.percentage >= (examination.passing_percentage || 50)).length / totalStatewideCandidates) * 100).toFixed(0)
    : '0';

  // Export Analytics Summary CSV
  const handleExportAnalyticsCsv = () => {
    const headers = ['LGA Name', 'Senatorial Zone', 'Candidates Enrolled', 'Mean Score (%)', 'Pass Rate (%)', 'Distinction Rate (%)', 'Highest Score (%)'];
    const rows = lgaData.map(l => [
      l.lga,
      l.zone,
      l.candidates,
      l.average,
      `${l.passRate}%`,
      `${l.distinctionRate}%`,
      l.highestScore
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Edo_State_Ministry_of_Education_${examination.code}_LGA_Performance_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-xs">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-100 text-orange-800 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Real-Time Cross-LGA & School Performance Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparative performance trends across all 18 Edo State LGAs and participating schools.
          </p>
        </div>

        {/* Dimension & LGA Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewDimension('lga')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewDimension === 'lga'
                  ? 'bg-white text-orange-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              18 LGAs
            </button>
            <button
              onClick={() => setViewDimension('schools')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewDimension === 'schools'
                  ? 'bg-white text-orange-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Schools League
            </button>
            <button
              onClick={() => setViewDimension('grades')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewDimension === 'grades'
                  ? 'bg-white text-orange-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grade Donut
            </button>
            <button
              onClick={() => setViewDimension('zones')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewDimension === 'zones'
                  ? 'bg-white text-orange-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zonal
            </button>
          </div>

          {/* LGA Filter Dropdown */}
          <select
            value={selectedLgaFilter}
            onChange={e => setSelectedLgaFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All 18 LGAs (Statewide)</option>
            {EDO_LGAS.map(lga => (
              <option key={lga.name} value={lga.name}>
                {lga.name} ({lga.zone})
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportAnalyticsCsv}
            title="Download LGA Performance Analytics Sheet"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Top Performing LGA</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1 truncate">
            {topLga?.lga || 'Oredo'}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs">
            <span className="font-black text-emerald-600">{topLga?.average || 0}%</span>
            <span className="text-[10px] text-slate-400">Mean ({topLga?.candidates || 0} Pupils)</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Statewide Mean</span>
          <div className="text-xl font-black text-orange-950 mt-1">{overallMean}%</div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> Target Benchmark: 50%
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Statewide Pass Rate</span>
          <div className="text-xl font-black text-blue-600 mt-1">{overallPassRate}%</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{results.filter(r => r.percentage >= 50).length} of {totalStatewideCandidates} Candidates</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Participating Units</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {lgaData.filter(l => l.candidates > 0).length} <span className="text-xs font-normal text-slate-500">LGAs</span> / {schools.length} <span className="text-xs font-normal text-slate-500">Schools</span>
          </div>
          <span className="text-[10px] text-indigo-600 font-medium mt-0.5 block">100% Real-Time Sync</span>
        </div>
      </div>

      {/* Main Interactive Chart Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Metric Switcher & Chart Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Display Metric:</span>
            <button
              onClick={() => setActiveMetric('average')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMetric === 'average'
                  ? 'bg-orange-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mean Score (%)
            </button>
            <button
              onClick={() => setActiveMetric('passRate')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMetric === 'passRate'
                  ? 'bg-orange-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pass Rate (%)
            </button>
            <button
              onClick={() => setActiveMetric('distinctionRate')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMetric === 'distinctionRate'
                  ? 'bg-orange-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Distinction Rate (%)
            </button>
            <button
              onClick={() => setActiveMetric('candidates')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMetric === 'candidates'
                  ? 'bg-orange-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pupil Volume
            </button>
          </div>

          {/* Chart View Toggle (Bar vs Area) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg cursor-pointer ${chartType === 'bar' ? 'bg-orange-100 text-orange-950 font-bold' : 'hover:bg-slate-100'}`}
              title="Bar Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg cursor-pointer ${chartType === 'area' ? 'bg-orange-100 text-orange-950 font-bold' : 'hover:bg-slate-100'}`}
              title="Area Trend"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. LGA COMPARISON VIEW */}
        {viewDimension === 'lga' && (
          <div className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={lgaData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="lga"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      domain={[0, activeMetric === 'candidates' ? 'auto' : 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      unit={activeMetric === 'candidates' ? '' : '%'}
                    />
                    <Tooltip
                      formatter={(val: any) => [
                        activeMetric === 'candidates' ? `${val} Candidates` : `${val}%`,
                        activeMetric === 'average' ? 'Mean Score' : activeMetric === 'passRate' ? 'Pass Rate' : activeMetric === 'distinctionRate' ? 'Distinction Rate' : 'Pupil Count'
                      ]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                      itemStyle={{ color: '#fbbf24' }}
                    />
                    <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Passing Benchmark (50%)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                    <Bar
                      dataKey={activeMetric}
                      radius={[6, 6, 0, 0]}
                    >
                      {lgaData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : index === 2 ? '#f59e0b' : '#64748b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={lgaData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="lga"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      domain={[0, activeMetric === 'candidates' ? 'auto' : 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      unit={activeMetric === 'candidates' ? '' : '%'}
                    />
                    <Tooltip
                      formatter={(val: any) => [
                        activeMetric === 'candidates' ? `${val} Candidates` : `${val}%`,
                        activeMetric === 'average' ? 'Mean Score' : activeMetric === 'passRate' ? 'Pass Rate' : activeMetric === 'distinctionRate' ? 'Distinction Rate' : 'Pupil Count'
                      ]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                      itemStyle={{ color: '#fbbf24' }}
                    />
                    <Area type="monotone" dataKey={activeMetric} stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* LGA Breakdown Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">LGA Jurisdiction</th>
                    <th className="py-2.5 px-3">Senatorial Zone</th>
                    <th className="py-2.5 px-3">Candidates</th>
                    <th className="py-2.5 px-3">Mean Score</th>
                    <th className="py-2.5 px-3">Pass Rate</th>
                    <th className="py-2.5 px-3">Distinction Rate</th>
                    <th className="py-2.5 px-3 text-right">Top Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {lgaData.map((lga, idx) => (
                    <tr key={lga.lga} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <span>{lga.lga}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {lga.zone}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono">{lga.candidates} Pupils</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{lga.average}%</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          lga.passRate >= 70 ? 'bg-emerald-100 text-emerald-800' :
                          lga.passRate >= 50 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {lga.passRate}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-emerald-700 font-semibold">{lga.distinctionRate}%</td>
                      <td className="py-2 px-3 text-right font-black text-amber-600">{lga.highestScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. SCHOOLS LEAGUE VIEW */}
        {viewDimension === 'schools' && (
          <div className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schoolData} margin={{ top: 10, right: 20, left: 0, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Mean Performance']}
                    labelFormatter={(label) => `School: ${label}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '50% Threshold', fill: '#ef4444', fontSize: 10 }} />
                  <Bar dataKey="average" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                    {schoolData.map((entry, index) => (
                      <Cell
                        key={`school-cell-${index}`}
                        fill={index === 0 ? '#10b981' : index === 1 ? '#06b6d4' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* School League Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">School Name</th>
                    <th className="py-2.5 px-3">EMIS Code</th>
                    <th className="py-2.5 px-3">LGA</th>
                    <th className="py-2.5 px-3">Candidates</th>
                    <th className="py-2.5 px-3">Mean Score</th>
                    <th className="py-2.5 px-3 text-right">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {schoolData.map((sch, i) => (
                    <tr key={sch.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sch.fullName}</span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{sch.code}</td>
                      <td className="py-2 px-3 text-slate-600">{sch.lga}</td>
                      <td className="py-2 px-3 font-mono">{sch.candidates}</td>
                      <td className="py-2 px-3 font-black text-orange-950">{sch.average}%</td>
                      <td className="py-2 px-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                          {sch.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. GRADES DONUT DISTRIBUTION */}
        {viewDimension === 'grades' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="count"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`grade-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [`${val} Pupils (${item.payload.percentage}%)`, item.payload.name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Grade Metrics List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Statewide Grading Breakdown ({selectedLgaFilter === 'ALL' ? 'All LGAs' : selectedLgaFilter})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {gradeDistribution.map(g => (
                  <div key={g.grade} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="font-bold text-xs text-slate-900">{g.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">{g.count} Pupils</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{g.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. SENATORIAL ZONAL BREAKDOWN */}
        {viewDimension === 'zones' && (
          <div className="space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="zone" tick={{ fontSize: 12, fill: '#334155', fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="average" name="Zonal Mean (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="passRate" name="Pass Rate (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {zoneData.map(z => (
                <div key={z.zone} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{z.zone}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{z.lgasCount} Active LGAs</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-slate-500">Mean Score:</span>
                    <span className="text-lg font-black text-orange-950">{z.average}%</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Pass Rate:</span>
                    <span className="text-xs font-bold text-blue-600">{z.passRate}%</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>Candidates:</span>
                    <span className="font-mono font-bold text-slate-700">{z.candidates}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
