import { useState, useEffect } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, FileText } from 'lucide-react';

export default function PDFViewer({ file, onBack }) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      // Object URLs must be created in an effect so they can be revoked on cleanup
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setObjectUrl(null);
      };
    }
    setObjectUrl(null);
  }, [file]);

  if (!file || !objectUrl) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px',
      }}>
        No PDF loaded
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(108, 99, 255, 0.1)',
              border: '1px solid rgba(108, 99, 255, 0.2)',
              color: 'var(--accent-light)',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(108, 99, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(108, 99, 255, 0.1)'}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}>
          <FileText size={14} color="var(--accent)" />
          <span className="truncate" style={{ maxWidth: '200px' }}>{file.name}</span>
        </div>
        
        <div style={{ width: '80px' }} />
      </div>

      {/* PDF iframe */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe
          src={`${objectUrl}#toolbar=0&navpanes=0`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#1a1a2e',
          }}
          title="PDF Viewer"
        />
      </div>
    </div>
  );
}
