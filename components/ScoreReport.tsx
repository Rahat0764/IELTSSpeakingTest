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
  if (!report) return <p className="text-white text-center">No report available.</p>;

  return (
    <div className="bg-card/80 backdrop-blur-md p-8 rounded-2xl border border-blue-500/30 max-w-2xl mx-auto text-white space-y-6 shadow-2xl animate-fadeIn">
      <h2 className="text-3xl font-bold text-center text-blue-400">IELTS Speaking Score Report</h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Fluency', value: report.fluency },
          { label: 'Lexical Resource', value: report.lexical_resource },
          { label: 'Grammatical Range', value: report.grammatical_range },
          { label: 'Pronunciation', value: report.pronunciation },
        ].map((item) => (
          <div key={item.label} className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</div>
            <div className="text-3xl font-bold text-blue-300">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-2xl font-bold mt-2">
        Overall Band: <span className="text-4xl text-blue-400">{report.overall_band}</span>
      </div>

      {report.grammar_mistakes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-red-400">Grammar Mistakes</h3>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 mt-2">
            {report.grammar_mistakes.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {report.pronunciation_issues.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-yellow-400">Pronunciation & Accent Issues</h3>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 mt-2">
            {report.pronunciation_issues.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-green-400">Band 8-9 Example Answer</h3>
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg italic text-gray-200 mt-2">
          {report.improved_answer_example}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-blue-300">Examiner's Feedback</h3>
        <p className="text-sm text-gray-200 mt-2 bg-gray-800/30 p-4 rounded-lg border border-blue-500/10">
          {report.feedback}
        </p>
      </div>
    </div>
  );
}