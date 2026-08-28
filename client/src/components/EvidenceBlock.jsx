const EvidenceBlock = ({ title, content }) => {
  if (!content) return null;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-slate-400 mb-2">{title}</h4>
      <div className="bg-slate-900 rounded-md p-4 border border-slate-700 overflow-x-auto">
        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{content}</pre>
      </div>
    </div>
  );
};

export default EvidenceBlock;
