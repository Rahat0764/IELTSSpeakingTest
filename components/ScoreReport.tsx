'use client';

interface Report {
  fluency: number;
  lexical_resource: number;
  grammatical_range: number;
  pronunciation: number;
  overall_band: number;
  grammar_mistakes: string[];
  pronunciation_issues: string[];
  improved_answer_example: string;
  feedback: string;
}

export default function ScoreReport({ report }: { report: Report | null }) {
  if (!report) return <p className="text-white">No report available.</p>;

  return (
    <div className="bg-card p-8 rounded-2xl border border-blue-500/30 max-w-2xl mx-auto text-white space-y-6">
      <h2 className="text-3xl font-bold text-center text-blue-400">IELTS Speaking Score Report</h2>
      <div className="grid grid-cols-2 gap-4 text-lg">
        <div className="bg-gray-800 p-3 rounded-lg"><span className="text-gray-400">Fluency:</span> {report.fluency}</div>
        <div className="bg-gray-800 p-3 rounded-lg"><span className="text-gray-400">Lexical Resource:</span> {report.lexical_resource}</div>
        <div className="bg-gray-800 p-3 rounded-lg"><span className="text-gray-400">Grammatical Range:</span> {report.grammatical_range}</div>
        <div className="bg-gray-800 p-3 rounded-lg"><span className="text-gray-400">Pronunciation:</span> {report.pronunciation}</div>
      </div>
      <div className="text-center text-2xl font-bold mt-4">Overall Band: {report.overall_band}</div>

      {report.grammar_mistakes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-red-400">Grammar Mistakes</h3>
          <ul className="list-disc list-inside text-sm text-gray-300">
            {report.grammar_mistakes.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {report.pronunciation_issues.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-yellow-400">Pronunciation & Accent Issues</h3>
          <ul className="list-disc list-inside text-sm text-gray-300">
            {report.pronunciation_issues.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-green-400">Band 8-9 Answer Example</h3>
        <p className="text-sm bg-gray-800 p-4 rounded-lg italic">{report.improved_answer_example}</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-blue-300">Examiner's Feedback</h3>
        <p className="text-sm text-gray-200 mt-2">{report.feedback}</p>
      </div>
    </div>
  );
}